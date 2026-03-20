import React, { Component, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenCapture from 'expo-screen-capture';
import Card from '../components/card';
import data1 from '../data/t1.json';
import data4 from '../data/t4.json';
import data5 from '../data/t5.json';
import data3 from '../data/t3.json';
import data2 from '../data/t2.json';

const AUTO_PLANE_INTERVAL = 21000;

// Responsive helpers — recalculate on each render in case of orientation change
const getMetrics = () => {
  const { width, height } = Dimensions.get('window');
  return {
    screenWidth: width,
    screenHeight: height,
    imageWidth: width - 40,
    imageHeight: Math.round((width - 40) * 0.52),
  };
};

class HomeClass extends Component {
  constructor(props) {
    super(props);
    this.state = {
      planes: data1,
      planes4: data4,
      planes5: data5,
      planes3: data3,
      planes2: data2,
      sources: [
        { items: data1, weight: 0.02, keyPrefix: 'd1' },  // T1 LEGENDARY
        { items: data2, weight: 0.06, keyPrefix: 'd2' },  // T2 EPIC
        { items: data3, weight: 0.12, keyPrefix: 'd3' },  // T3 RARE
        { items: data4, weight: 0.20, keyPrefix: 'd4' },  // T4 UNCOMMON
        { items: data5, weight: 0.60, keyPrefix: 'd5' },  // T5 COMMON

      ],
      selectedItem: null,
      userGuess: '',
      correctGuesses: [],
      isCorrect: false,
      feedbackMessage: '',
      waitingForNext: false,
    };
    this.intervalId = null;
  }

  componentDidMount() {
    this.loadCorrectGuesses();
    this.loadSelectedItem();
    this.loadUserState();
    this.loadWaitingForNext();
    this.checkAndGenerateItem();
    this.startAutoTimer();
    this.focusListener = this.props.navigation?.addListener('focus', () => {
      this.loadCorrectGuesses();
    });
    this.dimensionListener = Dimensions.addEventListener('change', () => {
      this.forceUpdate();
    });
  }

  componentWillUnmount() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.remainingTimerId) clearTimeout(this.remainingTimerId);
    if (this.focusListener) this.focusListener();
    if (this.dimensionListener) this.dimensionListener.remove?.();
  }

  startAutoTimer = () => {
    this.intervalId = setInterval(() => {
      this.generateSingle();
    }, AUTO_PLANE_INTERVAL);
  };

  checkAndGenerateItem = async () => {
    try {
      const lastTimestamp = await AsyncStorage.getItem('lastItemTimestamp');
      if (!lastTimestamp) { this.generateSingle(); return; }
      const elapsed = Date.now() - parseInt(lastTimestamp);
      const waiting = await AsyncStorage.getItem('waitingForNext');
      if (elapsed < AUTO_PLANE_INTERVAL) {
        if (waiting === 'true') return;
        const remaining = AUTO_PLANE_INTERVAL - elapsed;
        this.remainingTimerId = setTimeout(() => {
          this.generateSingle();
          clearInterval(this.intervalId);
          this.startAutoTimer();
        }, remaining);
        return;
      }
      this.generateSingle();
    } catch (error) {
      this.generateSingle();
    }
  };

  saveItemTimestamp = async () => {
    try { await AsyncStorage.setItem('lastItemTimestamp', Date.now().toString()); } catch (e) {}
  };

  loadWaitingForNext = async () => {
    try {
      const waiting = await AsyncStorage.getItem('waitingForNext');
      if (waiting === 'true') this.setState({ waitingForNext: true, selectedItem: null });
    } catch (e) {}
  };

  saveWaitingForNext = async (value) => {
    try { await AsyncStorage.setItem('waitingForNext', value ? 'true' : 'false'); } catch (e) {}
  };

  loadSelectedItem = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedItem');
      if (saved) this.setState({ selectedItem: JSON.parse(saved) });
    } catch (e) {}
  };

  saveSelectedItem = async (item) => {
    try { await AsyncStorage.setItem('selectedItem', JSON.stringify(item)); } catch (e) {}
  };

  loadUserState = async () => {
    try {
      const userGuess = await AsyncStorage.getItem('userGuess');
      const isCorrect = await AsyncStorage.getItem('isCorrect');
      const feedbackMessage = await AsyncStorage.getItem('feedbackMessage');
      if (userGuess) this.setState({ userGuess });
      if (isCorrect !== null) this.setState({ isCorrect: JSON.parse(isCorrect) });
      if (feedbackMessage) this.setState({ feedbackMessage });
    } catch (e) {}
  };

  saveUserState = async () => {
    try {
      const { userGuess, isCorrect, feedbackMessage } = this.state;
      await AsyncStorage.setItem('userGuess', userGuess);
      await AsyncStorage.setItem('isCorrect', JSON.stringify(isCorrect));
      await AsyncStorage.setItem('feedbackMessage', feedbackMessage);
    } catch (e) {}
  };

  loadCorrectGuesses = async () => {
    try {
      const saved = await AsyncStorage.getItem('correctGuesses');
      this.setState({ correctGuesses: saved ? JSON.parse(saved) : [] });
    } catch (e) {}
  };

  saveCorrectGuess = async (item) => {
    try {
      const saved = await AsyncStorage.getItem('correctGuesses');
      const currentGuesses = saved ? JSON.parse(saved) : [];
      const guessRecord = { name: item.name, DEXid: item.DEXid, timestamp: new Date().toISOString() };
      const updated = [...currentGuesses, guessRecord];
      await AsyncStorage.setItem('correctGuesses', JSON.stringify(updated));
      this.setState({ correctGuesses: updated });
    } catch (e) {}
  };

  handleGuess = (guessText) => {
    if (!this.state.selectedItem) return;
    const item = this.state.selectedItem;
    const userInputLower = guessText.toLowerCase().trim();
    const validGuesses = [
      item.name.toLowerCase(),
      item.guess1.toLowerCase(),
      item.guess2.toLowerCase(),
      item.guess3.toLowerCase(),
    ];
    if (validGuesses.includes(userInputLower)) {
      this.setState({ isCorrect: true, feedbackMessage: '✓ Correct! Next plane coming soon...', userGuess: '' });
      this.saveCorrectGuess(item);
      AsyncStorage.removeItem('selectedItem');
      this.saveWaitingForNext(true);
      setTimeout(() => {
        this.setState({ isCorrect: false, feedbackMessage: '', selectedItem: null, waitingForNext: true });
      }, 2000);
    } else {
      this.setState({ isCorrect: false, feedbackMessage: '✗ Incorrect. Try again!', userGuess: '' });
      this.saveUserState();
      setTimeout(() => { this.setState({ feedbackMessage: '' }); }, 1500);
    }
  };

  generateSingle = () => {
    const sources = this.state.sources || [];
    if (!sources.length) return this.setState({ selectedItem: null });
    const totalWeight = sources.reduce((s, src) => s + (src.weight || 0), 0) || 1;
    const cumulative = [];
    let c = 0;
    for (const src of sources) { c += (src.weight || 0) / totalWeight; cumulative.push(c); }
    const currentGuess1 = this.state.selectedItem?.guess1?.toLowerCase();
    let pick = null, chosenSource = null, attempts = 0;
    while (attempts < 10) {
      const r = Math.random();
      let idx = 0;
      while (idx < cumulative.length && r > cumulative[idx]) idx++;
      const chosen = sources[Math.min(idx, sources.length - 1)];
      const pool = chosen.items || [];
      if (!pool.length) break;
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      if (currentGuess1 && candidate.guess1?.toLowerCase() === currentGuess1) { attempts++; continue; }
      pick = candidate;
      chosenSource = chosen;
      break;
    }
    if (!pick) return this.setState({ selectedItem: null });
    const selectedItem = Object.assign({}, pick, { _mixedKey: `${chosenSource.keyPrefix || 's'}-single-${pick.id}` });
    this.setState({ selectedItem, waitingForNext: false }, () => {
      this.saveItemTimestamp();
      this.saveSelectedItem(pick);
      this.saveWaitingForNext(false);
    });
  };

  render() {
    const { selectedItem, userGuess, isCorrect, feedbackMessage, waitingForNext } = this.state;
    const { screenWidth, imageWidth, imageHeight } = getMetrics();
    const inputFontSize = Math.max(13, screenWidth * 0.038);
    const titleFontSize = Math.max(18, screenWidth * 0.055);
    const subtitleFontSize = Math.max(13, screenWidth * 0.038);

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {selectedItem && !waitingForNext ? (
          <View style={styles.guessGameContainer}>
            {/* Header */}
            <View style={styles.headerBanner}>
              <Text style={[styles.headerBannerText, { fontSize: Math.max(14, screenWidth * 0.042) }]}>
                ✈️  What plane is this?
              </Text>
            </View>

            {/* Image */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedItem.image }}
                style={[styles.guessImage, { width: imageWidth, height: imageHeight }]}
                resizeMode="cover"
              />
            </View>

            {/* Input Row */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { fontSize: inputFontSize }]}
                placeholder="Type your guess..."
                placeholderTextColor="#aaa"
                value={userGuess}
                onChangeText={text => this.setState({ userGuess: text })}
                onSubmitEditing={() => this.handleGuess(userGuess)}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.submitButton} onPress={() => this.handleGuess(userGuess)}>
                <Text style={[styles.submitButtonText, { fontSize: inputFontSize }]}>Submit</Text>
              </TouchableOpacity>
            </View>

            {/* Feedback */}
            {feedbackMessage ? (
              <Text style={[styles.feedbackText, { color: isCorrect ? '#4CAF50' : '#f44336', fontSize: Math.max(14, screenWidth * 0.042) }]}>
                {feedbackMessage}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            {feedbackMessage ? (
              <Text style={[styles.feedbackText, { color: '#4CAF50', fontSize: Math.max(14, screenWidth * 0.042), marginBottom: 20 }]}>
                {feedbackMessage}
              </Text>
            ) : null}
            <Text style={styles.emptyIcon}>✈️</Text>
            <Text style={[styles.emptyTitle, { fontSize: titleFontSize }]}>No plane for now!</Text>
            <Text style={[styles.emptySubtitle, { fontSize: subtitleFontSize }]}>
              A new plane will appear{'\n'}once the timer is up.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }
}

export default function Home(props) {
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    const unsubscribeFocus = props.navigation?.addListener('focus', () => {
      ScreenCapture.preventScreenCaptureAsync();
    });
    const unsubscribeBlur = props.navigation?.addListener('blur', () => {
      ScreenCapture.allowScreenCaptureAsync();
    });
    return () => {
      unsubscribeFocus?.();
      unsubscribeBlur?.();
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, [props.navigation]);

  return <HomeClass {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  guessGameContainer: {
    marginHorizontal: 16,
    marginTop: 60,
    paddingBottom: 30,
  },
  headerBanner: {
    backgroundColor: '#ca8f0f',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  headerBannerText: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  guessImage: {
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ca8f0f',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ca8f0f',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: 10,
    backgroundColor: '#fff',
    color: '#222',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 85,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  feedbackText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '30%',
    paddingHorizontal: '8%',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#888',
    textAlign: 'center',
    lineHeight: 26,
  },
});