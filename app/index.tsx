import { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export default function Index() {
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = timeLeft;
  const displayMinutes = Math.floor(totalSeconds / 60);
  const displaySeconds = totalSeconds % 60;

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            triggerAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && intervalRef.current && !sound) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, sound]);

  const triggerAlarm = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      }

      const { sound: alarmSound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3' },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      setSound(alarmSound);

      setTimeout(() => {
        alarmSound.stopAsync();
        alarmSound.unloadAsync();
        setSound(null);
      }, 10000);
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  };

  const startTimer = () => {
    const total = minutes * 60 + seconds;
    if (total > 0) {
      setTimeLeft(total);
      setIsRunning(true);
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
      setSound(null);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
      setSound(null);
    }
  };

  return (
    <View style={styles.container}>
      {!isRunning && timeLeft === 0 && !sound ? (
        <View style={styles.pickerContainer}>
          <View style={styles.customPickerWrapper}>
            <Text style={styles.label}>Minutes</Text>
            <View style={styles.customPicker}>
              <ScrollView
                style={styles.scrollPicker}
                contentContainerStyle={styles.scrollPickerContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={50}
                decelerationRate="fast"
                onScroll={(event) => {
                  const offsetY = event.nativeEvent.contentOffset.y;
                  const index = Math.round(offsetY / 50);
                  if (index >= 0 && index < 60 && index !== minutes) {
                    setMinutes(index);
                  }
                }}
                scrollEventThrottle={16}
              >
                {[...Array(60)].map((_, i) => (
                  <View key={i} style={styles.pickerItem}>
                    <Text style={[
                      styles.pickerItemText,
                      minutes === i && styles.pickerItemTextSelected
                    ]}>
                      {String(i).padStart(2, '0')}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.selectionOverlay} pointerEvents="none">
                <View style={styles.selectionHighlight} />
              </View>
            </View>
          </View>

          <View style={styles.customPickerWrapper}>
            <Text style={styles.label}>Seconds</Text>
            <View style={styles.customPicker}>
              <ScrollView
                style={styles.scrollPicker}
                contentContainerStyle={styles.scrollPickerContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={50}
                decelerationRate="fast"
                onScroll={(event) => {
                  const offsetY = event.nativeEvent.contentOffset.y;
                  const index = Math.round(offsetY / 50);
                  if (index >= 0 && index < 60 && index !== seconds) {
                    setSeconds(index);
                  }
                }}
                scrollEventThrottle={16}
              >
                {[...Array(60)].map((_, i) => (
                  <View key={i} style={styles.pickerItem}>
                    <Text style={[
                      styles.pickerItemText,
                      seconds === i && styles.pickerItemTextSelected
                    ]}>
                      {String(i).padStart(2, '0')}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.selectionOverlay} pointerEvents="none">
                <View style={styles.selectionHighlight} />
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>
            {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
          </Text>
          {sound && (
            <Text style={styles.alarmText}>ALARM RINGING!</Text>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!isRunning && timeLeft === 0 && !sound ? (
          <TouchableOpacity style={styles.startButton} onPress={startTimer}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 40,
  },
  customPickerWrapper: {
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 15,
    fontWeight: '600',
  },
  customPicker: {
    backgroundColor: '#1a1d23',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#3a3f47',
    overflow: 'hidden',
    position: 'relative',
  },
  scrollPicker: {
    height: 200,
    width: 100,
    zIndex: 1,
  },
  scrollPickerContent: {
    paddingVertical: 75,
  },
  pickerItem: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    color: '#888',
    fontSize: 24,
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 28,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  selectionHighlight: {
    height: 50,
    width: '100%',
    backgroundColor: '#4CAF50',
    opacity: 0.7,
    borderRadius: 8,
  },
  timerDisplay: {
    marginBottom: 40,
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
  },
  alarmText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff5722',
    marginTop: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  stopButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  resetButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
