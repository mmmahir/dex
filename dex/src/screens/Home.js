import React, { Component } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, ScrollView, Image, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/card';
import data1 from '../data/t1.json';
import data4 from '../data/t4.json';
import data5 from '../data/t5.json';

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (screenWidth / numColumns) - 30;
const AUTO_PLANE_INTERVAL = 20000; // Change this value to adjust interval (in milliseconds)

export default class test extends Component {
  constructor(props) {
    super(props);
    this.state = {
      planes: data1,
      planes4: data4,
      planes5: data5,
      // sources is an array of data sources with weights; add more entries to support more datasets
      sources: [
        { items: data1, weight: 0.05, keyPrefix: 'd1' },
        { items: data4, weight: 0.15, keyPrefix: 'd4' },
        { items: data5, weight: 0.8, keyPrefix: 'd5' },
      ],
      mixedPlanes: [],
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
  }

  componentWillUnmount() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.remainingTimerId) {
      clearTimeout(this.remainingTimerId);
    }
  }

  startAutoTimer = () => {
    this.intervalId = setInterval(() => {
      this.generateSingle();
    }, AUTO_PLANE_INTERVAL);
  };

  checkAndGenerateItem = async () => {
    try {
      const lastTimestamp = await AsyncStorage.getItem('lastItemTimestamp');

      if (!lastTimestamp) {
        this.generateSingle();
        return;
      }

      const elapsed = Date.now() - parseInt(lastTimestamp);
      const waiting = await AsyncStorage.getItem('waitingForNext');

      if (elapsed < AUTO_PLANE_INTERVAL) {
        if (waiting === 'true') {
          return;
        }
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
      console.error('Error checking item timestamp:', error);
      this.generateSingle();
    }
  };

  saveItemTimestamp = async () => {
    try {
      await AsyncStorage.setItem('lastItemTimestamp', Date.now().toString());
    } catch (error) {
      console.error('Error saving item timestamp:', error);
    }
  };

  loadWaitingForNext = async () => {
    try {
      const waiting = await AsyncStorage.getItem('waitingForNext');
      if (waiting === 'true') {
        this.setState({ waitingForNext: true, selectedItem: null });
      }
    } catch (error) {
      console.error('Error loading waitingForNext:', error);
    }
  };

  saveWaitingForNext = async (value) => {
    try {
      await AsyncStorage.setItem('waitingForNext', value ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving waitingForNext:', error);
    }
  };

  loadSelectedItem = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedItem');
      if (saved) {
        this.setState({ selectedItem: JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Error loading selected item:', error);
    }
  };

  saveSelectedItem = async (item) => {
    try {
      await AsyncStorage.setItem('selectedItem', JSON.stringify(item));
    } catch (error) {
      console.error('Error saving selected item:', error);
    }
  };

  loadUserState = async () => {
    try {
      const userGuess = await AsyncStorage.getItem('userGuess');
      const isCorrect = await AsyncStorage.getItem('isCorrect');
      const feedbackMessage = await AsyncStorage.getItem('feedbackMessage');
      if (userGuess) this.setState({ userGuess });
      if (isCorrect !== null) this.setState({ isCorrect: JSON.parse(isCorrect) });
      if (feedbackMessage) this.setState({ feedbackMessage });
    } catch (error) {
      console.error('Error loading user state:', error);
    }
  };

  saveUserState = async () => {
    try {
      const { userGuess, isCorrect, feedbackMessage } = this.state;
      await AsyncStorage.setItem('userGuess', userGuess);
      await AsyncStorage.setItem('isCorrect', JSON.stringify(isCorrect));
      await AsyncStorage.setItem('feedbackMessage', feedbackMessage);
    } catch (error) {
      console.error('Error saving user state:', error);
    }
  };

  loadCorrectGuesses = async () => {
    try {
      const saved = await AsyncStorage.getItem('correctGuesses');
      if (saved) {
        this.setState({ correctGuesses: JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Error loading correct guesses:', error);
    }
  };

  saveCorrectGuess = async (item) => {
    try {
      const { correctGuesses } = this.state;
      const guessRecord = { name: item.name, DEXid: item.DEXid, timestamp: new Date().toISOString() };
      console.log('Saving guess:', guessRecord);
      const updated = [...correctGuesses, guessRecord];
      await AsyncStorage.setItem('correctGuesses', JSON.stringify(updated));
      this.setState({ correctGuesses: updated });
    } catch (error) {
      console.error('Error saving correct guess:', error);
    }
  };

  getItemByName = (name) => {
    const allData = [...this.state.planes, ...this.state.planes4, ...this.state.planes5];
    return allData.find(item =>
      item.name.toLowerCase() === name.toLowerCase() ||
      item.guess1.toLowerCase() === name.toLowerCase() ||
      item.guess2.toLowerCase() === name.toLowerCase() ||
      item.guess3.toLowerCase() === name.toLowerCase()
    );
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
      this.setState({
        isCorrect: true,
        feedbackMessage: '✓ Correct! Next plane coming soon...',
        userGuess: '',
      });
      this.saveCorrectGuess(item);
      AsyncStorage.removeItem('selectedItem');
      this.saveWaitingForNext(true);
      setTimeout(() => {
        this.setState({
          isCorrect: false,
          feedbackMessage: '',
          selectedItem: null,
          waitingForNext: true,
        });
      }, 2000);
    } else {
      this.setState({
        isCorrect: false,
        feedbackMessage: '✗ Incorrect. Try again!',
        userGuess: ''
      });
      this.saveUserState();
      setTimeout(() => {
        this.setState({ feedbackMessage: '' });
      }, 1500);
    }
  };

  handleGuessButton = (guess) => {
    this.handleGuess(guess);
  };

  generateMixed = (size) => {
    const sources = this.state.sources || [];
    if (!sources.length) return this.setState({ mixedPlanes: [] });
    const totalWeight = sources.reduce((s, src) => s + (src.weight || 0), 0) || 1;
    const cumulative = [];
    let c = 0;
    for (const src of sources) {
      c += (src.weight || 0) / totalWeight;
      cumulative.push(c);
    }
    const itemsCount = size || Math.max(1, sources.reduce((s, src) => s + (src.items ? src.items.length : 0), 0));
    const mixed = [];
    for (let i = 0; i < itemsCount; i++) {
      const r = Math.random();
      let idx = 0;
      while (idx < cumulative.length && r > cumulative[idx]) idx++;
      const chosen = sources[Math.min(idx, sources.length - 1)];
      const pool = chosen.items || [];
      if (!pool.length) continue;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      mixed.push(Object.assign({}, pick, { _mixedKey: `${chosen.keyPrefix || 's'}-${i}-${pick.id}` }));
    }
    this.setState({ mixedPlanes: mixed });
  };

  // Pick a single item using configured source weights.
  // Will re-roll if the candidate shares the same guess1 as the current item,
  // preventing the same plane "family" (e.g. any Bf 109 variant) from appearing twice in a row.
  generateSingle = () => {
    const sources = this.state.sources || [];
    if (!sources.length) return this.setState({ selectedItem: null });

    const totalWeight = sources.reduce((s, src) => s + (src.weight || 0), 0) || 1;
    const cumulative = [];
    let c = 0;
    for (const src of sources) {
      c += (src.weight || 0) / totalWeight;
      cumulative.push(c);
    }

    const currentGuess1 = this.state.selectedItem?.guess1?.toLowerCase();

    let pick = null;
    let chosenSource = null;
    let attempts = 0;

    while (attempts < 10) {
      const r = Math.random();
      let idx = 0;
      while (idx < cumulative.length && r > cumulative[idx]) idx++;
      const chosen = sources[Math.min(idx, sources.length - 1)];
      const pool = chosen.items || [];
      if (!pool.length) break;

      const candidate = pool[Math.floor(Math.random() * pool.length)];

      // Re-roll if candidate is in the same "family" as the current plane
      // (identified by sharing the same guess1, e.g. "Bf 109")
      if (currentGuess1 && candidate.guess1?.toLowerCase() === currentGuess1) {
        attempts++;
        continue;
      }

      pick = candidate;
      chosenSource = chosen;
      break;
    }

    if (!pick) return this.setState({ selectedItem: null });

    const selectedItem = Object.assign({}, pick, {
      _mixedKey: `${chosenSource.keyPrefix || 's'}-single-${pick.id}`,
    });

    this.setState(
      { selectedItem, waitingForNext: false },
      () => {
        this.saveItemTimestamp();
        this.saveSelectedItem(pick);
        this.saveWaitingForNext(false);
      }
    );
  };

  render() {
    const { selectedItem, userGuess, isCorrect, feedbackMessage, waitingForNext } = this.state;
    return (
      <ScrollView style={styles.container}>
        {selectedItem && !waitingForNext ? (
          <View style={styles.guessGameContainer}>
            {/* Image Display */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedItem.image }} style={styles.guessImage} />
            </View>
            {/* Input Field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type your guess..."
                value={userGuess}
                onChangeText={text => this.setState({ userGuess: text })}
                onSubmitEditing={() => this.handleGuess(userGuess)}
              />
              <TouchableOpacity style={styles.submitButton} onPress={() => this.handleGuess(userGuess)}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
            {/* Feedback Message */}
            {feedbackMessage ? (
              <Text style={[styles.feedbackText, { color: isCorrect ? '#4CAF50' : '#f44336' }]}>
                {feedbackMessage}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            {feedbackMessage ? (
              <Text style={[styles.feedbackText, { color: '#4CAF50', marginBottom: 20 }]}>
                {feedbackMessage}
              </Text>
            ) : null}
            <Text style={styles.emptyIcon}>✈️</Text>
            <Text style={styles.emptyTitle}>No plane for now!</Text>
            <Text style={styles.emptySubtitle}>
              A new plane will appear{'\n'}once the timer is up.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: '#f5f5f5',
  },
  guessGameContainer: {
    margin: 15,
    marginTop: 100,
    paddingBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 15,
  },
  guessImage: {
    width: 340,
    height: 220,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ca8f0f',
  },
  guessesContainer: {
    marginBottom: 20,
  },
  guessLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  guessButton: {
    backgroundColor: '#ca8f0f',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#b8860b',
  },
  guessButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ca8f0f',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#ca8f0f',
    padding: 15,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
});