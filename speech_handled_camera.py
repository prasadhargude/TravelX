import cv2
import speech_recognition as sr
import time
import os
import threading
import queue
import numpy as np
from datetime import datetime
import logging
import json
import sys

# Set UTF-8 encoding for console output on Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except:
        pass  # Python < 3.7 doesn't have reconfigure

# Platform-specific imports for sound
try:
    import winsound
    WINDOWS_PLATFORM = True
except ImportError:
    WINDOWS_PLATFORM = False

# Configure logging with UTF-8 encoding to handle emojis
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('camera_app.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class VoiceCamera:
    def __init__(self):
        """Initialize the Voice Camera application with all necessary components."""
        self.config = self.load_config()
        self.cap = None
        self.recognizer = sr.Recognizer()
        self.mic = None
        self.audio_queue = queue.Queue()
        self.command_queue = queue.Queue()  # NEW: Queue for processed commands
        self.running = True
        self.last_capture_time = 0
        self.capture_cooldown = 2
        self.current_frame = None
        self.frame_lock = threading.Lock()
        self.countdown_active = False
        
        # Video recording state
        self.is_recording = False
        self.video_writer = None
        self.video_frames = []
        self.recording_start_time = None
        
        # Processing state indicators
        self.is_processing_audio = False
        self.last_speech_time = 0
        self.processing_start_time = 0
        
        # Create snapshot and video folders
        self.base_folder = self.config['snapshot_folder']
        self.indoor_folder = os.path.join(self.base_folder, "indoor")
        self.outdoor_folder = os.path.join(self.base_folder, "outdoor")
        self.outdoor_video_folder = os.path.join(self.base_folder, "outdoor_videos")
        
        # Create all folders
        for folder in [self.indoor_folder, self.outdoor_folder, self.outdoor_video_folder]:
            os.makedirs(folder, exist_ok=True)
        
    def load_config(self):
        """Load configuration from file or use defaults."""
        default_config = {
            'snapshot_folder': 'snapshots',
            'camera_index': 0,
            'audio_energy_threshold': 2000,
            'phrase_time_limit': 3,  # Reduced from 5 to 3 for faster response
            'pause_threshold': 0.8,  # Increased from 0.5 for better command detection
            'show_live_feed': True,
            'countdown_seconds': 3,
            'enable_beep': True,
            'video_fps': 30.0,
            'video_codec': 'mp4v'
        }
        
        config_file = 'camera_config.json'
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
                    logger.info("Configuration loaded from file")
            except Exception as e:
                logger.warning(f"Could not load config file: {e}, using defaults")
        else:
            with open(config_file, 'w') as f:
                json.dump(default_config, f, indent=4)
                logger.info("Default configuration saved to camera_config.json")
        
        return default_config
    
    def initialize_camera(self):
        """Initialize camera with error handling."""
        try:
            camera_indices = [self.config['camera_index'], 0, 1, 2]
            
            for idx in camera_indices:
                logger.info(f"Trying camera index {idx}...")
                self.cap = cv2.VideoCapture(idx)
                
                if self.cap.isOpened():
                    self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                    self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                    self.cap.set(cv2.CAP_PROP_FPS, 30)
                    
                    ret, test_frame = self.cap.read()
                    if ret and test_frame is not None:
                        logger.info(f"✅ Camera initialized successfully on index {idx}")
                        return True
                    else:
                        self.cap.release()
            
            raise Exception("No working camera found")
            
        except Exception as e:
            logger.error(f"Failed to initialize camera: {e}")
            return False
    
    def initialize_microphone(self):
        """Initialize microphone with error handling."""
        try:
            mics = sr.Microphone.list_microphone_names()
            logger.info(f"Available microphones: {mics}")
            
            self.mic = sr.Microphone()
            
            self.recognizer.energy_threshold = self.config['audio_energy_threshold']
            self.recognizer.dynamic_energy_threshold = True
            self.recognizer.pause_threshold = self.config['pause_threshold']
            
            with self.mic as source:
                logger.info("Adjusting for ambient noise... Please wait.")
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                logger.info(f"✅ Microphone initialized. Energy threshold: {self.recognizer.energy_threshold}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize microphone: {e}")
            return False
    
    def play_beep(self, frequency=1000, duration=200):
        """Play a beep sound for feedback."""
        if self.config['enable_beep'] and WINDOWS_PLATFORM:
            try:
                winsound.Beep(frequency, duration)
            except:
                pass
    
    def camera_feed_thread(self):
        """Continuously update camera feed in a separate thread."""
        logger.info("Camera feed thread started")
        
        while self.running:
            if self.cap and self.cap.isOpened():
                ret, frame = self.cap.read()
                if ret and frame is not None:
                    with self.frame_lock:
                        self.current_frame = frame.copy()
                        
                        if self.is_recording and self.video_writer is not None:
                            self.video_writer.write(frame)
                            
            time.sleep(0.03)  # ~30 FPS
    
    def audio_listener(self):
        """Continuous audio listening in a separate thread."""
        logger.info("Audio listener thread started")
        
        while self.running:
            try:
                with self.mic as source:
                    try:
                        audio = self.recognizer.listen(
                            source, 
                            timeout=0.5,
                            phrase_time_limit=self.config['phrase_time_limit']
                        )
                        # Mark that we captured speech
                        self.last_speech_time = time.time()
                        print("\n🎤 Processing speech...", end='', flush=True)
                        threading.Thread(target=self.play_beep, args=(600, 100), daemon=True).start()
                        self.audio_queue.put(audio)
                    except sr.WaitTimeoutError:
                        pass
                    
            except Exception as e:
                logger.error(f"Error in audio listener: {e}")
                time.sleep(0.5)
    
    def audio_processor(self):
        """NEW: Process audio recognition in a separate thread to avoid blocking."""
        logger.info("Audio processor thread started")
        
        while self.running:
            try:
                # Get audio from queue with timeout
                try:
                    audio = self.audio_queue.get(timeout=0.1)
                    self.is_processing_audio = True
                    self.processing_start_time = time.time()
                except queue.Empty:
                    continue
                
                # Process the audio (this is the blocking part, now in separate thread)
                try:
                    text = self.recognizer.recognize_google(audio).lower()
                    
                    processing_time = time.time() - self.processing_start_time
                    logger.info(f"📢 Recognized: '{text}' (took {processing_time:.1f}s)")
                    print(f"\r🎤 You said: '{text}' ✅                    ")
                    
                    # Determine command type
                    command_type = None
                    
                    # Check for stop video command
                    if self.is_recording and any(word in text for word in ["stop", "finish", "end", "done"]):
                        print("🛑 Stop recording command detected!")
                        command_type = 'stop_video'
                    
                    # Check for video recording commands
                    elif any(phrase in text for phrase in ["record video", "start recording", "capture video", "video outside"]):
                        print("🎥 Video recording command detected!")
                        command_type = 'start_video'
                    
                    # Check for greeting commands
                    elif any(greeting in text for greeting in ["good morning", "hello", "hi there", "good afternoon", "good evening"]):
                        print(f"😊 Greeting detected! Starting countdown...")
                        command_type = 'greeting'
                    
                    # Check for "tata" commands
                    elif "tata" in text:
                        if any(word in text for word in ["inside", "indoor", "in"]):
                            print("✨ Indoor capture command detected!")
                            command_type = 'indoor'
                        elif any(word in text for word in ["outside", "outdoor", "out"]):
                            print("✨ Outdoor capture command detected!")
                            command_type = 'outdoor'
                        elif any(word in text for word in ["capture", "picture", "photo", "snap", "cheese", "click"]):
                            print("✨ Capture command detected (defaulting to indoor)!")
                            command_type = 'indoor'
                    
                    # Check for simple capture commands
                    elif any(word in text for word in ["capture", "picture", "photo", "snap", "cheese", "click", "shoot"]):
                        print("📸 Quick capture command detected (storing in outdoor)!")
                        command_type = 'voice'
                    
                    # Check for countdown commands
                    elif any(phrase in text for phrase in ["countdown", "timer", "pose"]):
                        print("⏰ Countdown capture initiated!")
                        command_type = 'countdown'
                    
                    # If we have a command, put it in the command queue
                    if command_type:
                        self.command_queue.put((command_type, text))
                    else:
                        print("❓ Command not recognized")
                    
                except sr.UnknownValueError:
                    print("\r❌ Could not understand audio                    ")
                except sr.RequestError as e:
                    logger.error(f"Google Speech API error: {e}")
                    print(f"\r⚠️ Speech recognition API error. Check internet.     ")
                
                self.is_processing_audio = False
                
            except Exception as e:
                logger.error(f"Error in audio processor: {e}")
                self.is_processing_audio = False
                time.sleep(0.1)
    
    def start_video_recording(self):
        """Start recording video to the outdoor video folder."""
        try:
            if self.is_recording:
                print("⚠️ Already recording a video!")
                return False
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.join(self.outdoor_video_folder, f"outdoor_video_{timestamp}.mp4")
            
            with self.frame_lock:
                if self.current_frame is None:
                    print("❌ No camera frame available!")
                    return False
                h, w = self.current_frame.shape[:2]
            
            fourcc = cv2.VideoWriter_fourcc(*self.config['video_codec'])
            self.video_writer = cv2.VideoWriter(filename, fourcc, self.config['video_fps'], (w, h))
            
            if not self.video_writer.isOpened():
                print("❌ Failed to initialize video writer!")
                return False
            
            self.is_recording = True
            self.recording_start_time = time.time()
            
            print(f"\n🎥 Recording started!")
            print(f"📁 Video will be saved to: {filename}")
            print(f"🛑 Say 'stop' to end recording")
            
            threading.Thread(target=self.play_beep, args=(800, 300), daemon=True).start()
            
            return True
            
        except Exception as e:
            logger.error(f"Error starting video recording: {e}")
            print(f"❌ Error starting video recording: {e}")
            return False
    
    def stop_video_recording(self):
        """Stop the current video recording."""
        try:
            if not self.is_recording:
                print("⚠️ No video is being recorded!")
                return False
            
            self.is_recording = False
            
            if self.video_writer is not None:
                self.video_writer.release()
                self.video_writer = None
            
            if self.recording_start_time:
                duration = time.time() - self.recording_start_time
                minutes = int(duration // 60)
                seconds = int(duration % 60)
                
                print(f"\n✅ Video recording stopped!")
                print(f"⏱️ Recording duration: {minutes:02d}:{seconds:02d}")
                
                threading.Thread(target=self.play_beep, args=(1200, 300), daemon=True).start()
                
                self.recording_start_time = None
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error stopping video recording: {e}")
            print(f"❌ Error stopping video recording: {e}")
            return False
    
    def countdown_capture(self, countdown_seconds=None):
        """Perform a countdown before capturing the photo."""
        if countdown_seconds is None:
            countdown_seconds = self.config['countdown_seconds']
        
        self.countdown_active = True
        print(f"\n📸 Get ready! Capturing in {countdown_seconds} seconds...")
        
        countdown_window = "Pose for Photo"
        start_time = time.time()
        
        while time.time() - start_time < countdown_seconds:
            remaining = countdown_seconds - int(time.time() - start_time)
            
            with self.frame_lock:
                if self.current_frame is not None:
                    display_frame = self.current_frame.copy()
                    
                    h, w = display_frame.shape[:2]
                    
                    overlay = display_frame.copy()
                    cv2.rectangle(overlay, (w//2 - 100, h//2 - 100), 
                                (w//2 + 100, h//2 + 50), (0, 0, 0), -1)
                    cv2.addWeighted(overlay, 0.5, display_frame, 0.5, 0, display_frame)
                    
                    cv2.putText(display_frame, str(remaining), 
                              (w//2 - 50, h//2), 
                              cv2.FONT_HERSHEY_SIMPLEX, 4, (0, 255, 0), 8)
                    
                    cv2.putText(display_frame, "POSE!", 
                              (w//2 - 70, h//2 + 40), 
                              cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 255), 3)
                    
                    cv2.imshow(countdown_window, display_frame)
                    
                    if int(time.time() - start_time) != int((time.time() - 0.1) - start_time):
                        threading.Thread(target=self.play_beep, args=(800, 100), daemon=True).start()
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.countdown_active = False
                cv2.destroyWindow(countdown_window)
                return None
        
        threading.Thread(target=self.play_beep, args=(1200, 300), daemon=True).start()
        
        with self.frame_lock:
            if self.current_frame is not None:
                captured_frame = self.current_frame.copy()
                
                cv2.putText(captured_frame, "CAPTURED!", 
                          (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 4)
                cv2.imshow("Captured Moment", captured_frame)
                cv2.waitKey(1000)
                cv2.destroyWindow("Captured Moment")
                
        cv2.destroyWindow(countdown_window)
        self.countdown_active = False
        
        return captured_frame if 'captured_frame' in locals() else None
    
    def capture_photo(self, mode='indoor', use_countdown=False):
        """Capture and save a photo with the specified mode."""
        try:
            current_time = time.time()
            if current_time - self.last_capture_time < self.capture_cooldown:
                print("⏳ Please wait a moment before taking another photo...")
                return False
            
            frame = None
            
            if use_countdown or mode == 'greeting':
                frame = self.countdown_capture()
                if frame is None:
                    return False
            else:
                with self.frame_lock:
                    if self.current_frame is None:
                        logger.error("No frame available")
                        print("❌ No camera frame available!")
                        return False
                    frame = self.current_frame.copy()
            
            if mode == 'greeting':
                folder = self.indoor_folder
                save_mode = 'indoor_greeting'
            elif mode == 'voice' or mode == 'countdown':
                folder = self.outdoor_folder
                save_mode = 'outdoor_voice' if mode == 'voice' else 'outdoor_countdown'
            elif mode == 'indoor':
                folder = self.indoor_folder
                save_mode = 'indoor'
            elif mode == 'outdoor':
                folder = self.outdoor_folder
                save_mode = 'outdoor'
            else:
                folder = self.outdoor_folder
                save_mode = mode
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            timestamp_display = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            filename = os.path.join(folder, f"{save_mode}_{timestamp}.jpg")
            
            success = cv2.imwrite(filename, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
            
            if success:
                logger.info(f"📸 Captured {mode} photo: {filename}")
                print(f"\n✅ Photo saved successfully!")
                print(f"📁 Location: {filename}")
                print(f"📸 Mode: {mode.upper()} -> {os.path.basename(folder).upper()}")
                print(f"🕒 Time: {timestamp_display}")
                
                threading.Thread(target=self.play_beep, args=(1000, 200), daemon=True).start()
                
                if not use_countdown and mode != 'greeting':
                    self.show_capture_effect()
                
                self.last_capture_time = current_time
                return True
            else:
                print("❌ Failed to save photo!")
                return False
            
        except Exception as e:
            logger.error(f"Error capturing photo: {e}")
            print(f"❌ Error capturing photo: {e}")
            return False
    
    def show_capture_effect(self):
        """Show a visual effect when photo is captured."""
        try:
            with self.frame_lock:
                if self.current_frame is not None:
                    flash_frame = np.ones_like(self.current_frame) * 255
                    cv2.imshow('Camera Feed', flash_frame)
                    cv2.waitKey(100)
        except Exception as e:
            logger.warning(f"Could not show capture effect: {e}")
    
    def run(self):
        """Main application loop."""
        print("\n" + "="*60)
        print("🎤 ADVANCED VOICE-CONTROLLED CAMERA SYSTEM WITH VIDEO")
        print("="*60)
        
        print("\n🔧 Initializing components...")
        
        if not self.initialize_camera():
            print("❌ Failed to initialize camera. Please check if camera is connected.")
            return
        
        if not self.initialize_microphone():
            print("❌ Failed to initialize microphone. Please check microphone permissions.")
            return
        
        print("\n✅ All components initialized successfully!")
        print("\n" + "="*60)
        print("📸 VOICE COMMANDS:")
        print("\n  TATA Commands:")
        print("  • 'Tata capture inside' - Indoor photo")
        print("  • 'Tata capture outside' - Outdoor photo")
        print("  • 'Tata click/snap' - Quick capture (indoor)")
        print("\n  Greeting Commands (3-second countdown -> Indoor):")
        print("  • 'Good morning' - Morning capture")
        print("  • 'Hello' / 'Hi there' - Greeting capture")
        print("\n  Quick Commands (saved to Outdoor):")
        print("  • 'Take picture' / 'Capture' - Instant capture")
        print("  • 'Countdown' / 'Timer' - 3-second timer capture")
        print("\n  🎥 VIDEO Commands:")
        print("  • 'Record video' / 'Start recording' - Start outdoor video")
        print("  • 'Stop' / 'Finish' / 'End' - Stop recording")
        print("\n🎮 KEYBOARD CONTROLS:")
        print("  • Press 'Q' - Quit")
        print("  • Press 'S' - Show status")
        print("  • Press 'C' - Manual capture (outdoor)")
        print("  • Press 'T' - Timer capture (3 seconds, outdoor)")
        print("  • Press 'I' - Indoor capture")
        print("  • Press 'O' - Outdoor capture")
        print("  • Press 'V' - Start/Stop video recording")
        print("="*60)
        print("\n👂 Listening for commands...\n")
        
        # Start camera feed thread
        camera_thread = threading.Thread(target=self.camera_feed_thread, daemon=True)
        camera_thread.start()
        
        # Start audio listener thread
        listener_thread = threading.Thread(target=self.audio_listener, daemon=True)
        listener_thread.start()
        
        # Start audio processor thread (NEW - this prevents blocking)
        processor_thread = threading.Thread(target=self.audio_processor, daemon=True)
        processor_thread.start()
        
        time.sleep(0.5)
        
        # Main loop with camera display
        try:
            while self.running:
                # Display camera feed
                if not self.countdown_active:
                    with self.frame_lock:
                        if self.current_frame is not None:
                            display_frame = self.current_frame.copy()
                            
                            h, w = display_frame.shape[:2]
                            
                            # Top bar
                            cv2.rectangle(display_frame, (0, 0), (w, 40), (0, 0, 0), -1)
                            
                            # Show processing indicator
                            if self.is_processing_audio:
                                status_text = "🎤 PROCESSING SPEECH... Please wait"
                                color = (0, 165, 255)  # Orange
                            elif self.is_recording:
                                status_text = "🔴 RECORDING VIDEO | Say 'stop' to end"
                                color = (0, 255, 0)
                            else:
                                status_text = "Voice Commands Active | Press Q to quit | S for status"
                                color = (0, 255, 0)
                            
                            cv2.putText(display_frame, status_text, 
                                      (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                            
                            # Recording indicator
                            if self.is_recording:
                                if int(time.time() * 2) % 2:
                                    cv2.circle(display_frame, (w-30, 20), 10, (0, 0, 255), -1)
                                cv2.putText(display_frame, "REC", (w-80, 25), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                                
                                if self.recording_start_time:
                                    duration = int(time.time() - self.recording_start_time)
                                    minutes = duration // 60
                                    seconds = duration % 60
                                    cv2.putText(display_frame, f"{minutes:02d}:{seconds:02d}", 
                                              (w-150, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                            elif self.is_processing_audio:
                                # Show processing animation
                                if int(time.time() * 4) % 2:
                                    cv2.circle(display_frame, (w-30, 20), 8, (0, 165, 255), -1)
                                cv2.putText(display_frame, "PROCESSING", (w-140, 25), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 2)
                            else:
                                cv2.circle(display_frame, (w-30, 20), 8, (0, 255, 0), -1)
                                cv2.putText(display_frame, "LIVE", (w-80, 25), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                            
                            # Bottom info bar
                            cv2.rectangle(display_frame, (0, h-30), (w, h), (0, 0, 0), -1)
                            
                            indoor_photos = len([f for f in os.listdir(self.indoor_folder) if f.endswith('.jpg')])
                            outdoor_photos = len([f for f in os.listdir(self.outdoor_folder) if f.endswith('.jpg')])
                            videos = len([f for f in os.listdir(self.outdoor_video_folder) if f.endswith('.mp4')])
                            
                            info_text = f"Indoor Photos: {indoor_photos} | Outdoor Photos: {outdoor_photos} | Videos: {videos}"
                            cv2.putText(display_frame, info_text, (10, h-10), 
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                            
                            cv2.imshow('Camera Feed', display_frame)
                
                # Process commands from queue (non-blocking)
                try:
                    command_type, recognized_text = self.command_queue.get_nowait()
                    
                    if command_type == 'start_video':
                        self.start_video_recording()
                    elif command_type == 'stop_video':
                        self.stop_video_recording()
                    elif command_type == 'greeting':
                        self.capture_photo('greeting', use_countdown=True)
                    elif command_type == 'countdown':
                        self.capture_photo('countdown', use_countdown=True)
                    elif command_type == 'voice':
                        self.capture_photo('voice')
                    else:
                        self.capture_photo(command_type)
                        
                except queue.Empty:
                    pass
                
                # Check for keyboard input
                key = cv2.waitKey(1) & 0xFF
                
                if key == ord('q') or key == ord('Q'):
                    if self.is_recording:
                        print("\n⚠️ Stopping video recording before exit...")
                        self.stop_video_recording()
                    print("\n👋 Shutting down...")
                    self.running = False
                elif key == ord('s') or key == ord('S'):
                    self.print_status()
                elif key == ord('c') or key == ord('C'):
                    print("\n📸 Manual capture (saving to Outdoor)...")
                    self.capture_photo('voice')
                elif key == ord('t') or key == ord('T'):
                    print("\n⏰ Timer capture (saving to Outdoor)...")
                    self.capture_photo('countdown', use_countdown=True)
                elif key == ord('i') or key == ord('I'):
                    print("\n🏠 Indoor capture...")
                    self.capture_photo('indoor')
                elif key == ord('o') or key == ord('O'):
                    print("\n🌳 Outdoor capture...")
                    self.capture_photo('outdoor')
                elif key == ord('v') or key == ord('V'):
                    if self.is_recording:
                        print("\n🛑 Stopping video recording...")
                        self.stop_video_recording()
                    else:
                        print("\n🎥 Starting video recording...")
                        self.start_video_recording()
                
        except KeyboardInterrupt:
            print("\n\n👋 Interrupted by user")
        finally:
            if self.is_recording:
                self.stop_video_recording()
            self.cleanup()
    
    def print_status(self):
        """Print current system status."""
        print("\n" + "="*50)
        print("📊 SYSTEM STATUS")
        print("="*50)
        print(f"Camera: {'✅ Active' if self.cap and self.cap.isOpened() else '❌ Inactive'}")
        print(f"Microphone: {'✅ Active' if self.mic else '❌ Inactive'}")
        print(f"Energy Threshold: {self.recognizer.energy_threshold:.0f}")
        print(f"Beep Sound: {'✅ Enabled' if self.config['enable_beep'] else '❌ Disabled'}")
        print(f"Video Recording: {'🔴 RECORDING' if self.is_recording else '⚪ Not Recording'}")
        
        if self.is_recording and self.recording_start_time:
            duration = int(time.time() - self.recording_start_time)
            print(f"Recording Duration: {duration//60:02d}:{duration%60:02d}")
        
        try:
            indoor_count = len([f for f in os.listdir(self.indoor_folder) if f.endswith('.jpg')])
            outdoor_count = len([f for f in os.listdir(self.outdoor_folder) if f.endswith('.jpg')])
            video_count = len([f for f in os.listdir(self.outdoor_video_folder) if f.endswith('.mp4')])
            
            print(f"\n📁 Media Statistics:")
            print(f"  Indoor Photos: {indoor_count}")
            print(f"  Outdoor Photos: {outdoor_count}")
            print(f"  Videos: {video_count}")
            print(f"  Total Media: {indoor_count + outdoor_count + video_count}")
            
            all_photos = []
            for folder in [self.indoor_folder, self.outdoor_folder]:
                for file in os.listdir(folder):
                    if file.endswith('.jpg'):
                        full_path = os.path.join(folder, file)
                        all_photos.append((os.path.getmtime(full_path), file, folder))
            
            if all_photos:
                all_photos.sort(reverse=True)
                last_time, last_file, last_folder = all_photos[0]
                folder_name = os.path.basename(last_folder)
                print(f"\n📸 Last Photo: {last_file}")
                print(f"   Location: {folder_name}")
                print(f"   Taken: {datetime.fromtimestamp(last_time).strftime('%Y-%m-%d %H:%M:%S')}")
            
            all_videos = []
            for file in os.listdir(self.outdoor_video_folder):
                if file.endswith('.mp4'):
                    full_path = os.path.join(self.outdoor_video_folder, file)
                    all_videos.append((os.path.getmtime(full_path), file))
            
            if all_videos:
                all_videos.sort(reverse=True)
                last_time, last_file = all_videos[0]
                print(f"\n🎥 Last Video: {last_file}")
                print(f"   Taken: {datetime.fromtimestamp(last_time).strftime('%Y-%m-%d %H:%M:%S')}")
                
        except Exception as e:
            print(f"Error getting media statistics: {e}")
        
        print("="*50 + "\n")
    
    def cleanup(self):
        """Clean up resources."""
        logger.info("Cleaning up resources...")
        self.running = False
        
        if self.is_recording:
            self.stop_video_recording()
        
        if self.cap:
            self.cap.release()
        
        cv2.destroyAllWindows()
        
        try:
            total_photos = 0
            total_videos = 0
            
            for folder in [self.indoor_folder, self.outdoor_folder]:
                total_photos += len([f for f in os.listdir(folder) if f.endswith('.jpg')])
            
            total_videos = len([f for f in os.listdir(self.outdoor_video_folder) if f.endswith('.mp4')])
            
            if total_photos > 0 or total_videos > 0:
                print(f"\n📊 Session Summary:")
                print(f"   Photos captured: {total_photos}")
                print(f"   Videos recorded: {total_videos}")
        except:
            pass
        
        logger.info("Application closed successfully")
        print("✅ Application closed successfully")

if __name__ == "__main__":
    try:
        print("Starting Voice-Controlled Camera System with Video Recording...")
        app = VoiceCamera()
        app.run()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        logger.error(f"Fatal error: {e}", exc_info=True)
