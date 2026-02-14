import React, { Component } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, ScrollView, Image, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/card';
import data1 from '../data/t1.json';
import data5 from '../data/t5.json';

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (screenWidth / numColumns) - 30;
const AUTO_PLANE_INTERVAL = 60000; // Change this value to adjust interval (in milliseconds)

export default class test extends Component {
  constructor(props) {
    super(props);
    this.state = {
      planes: data1,
      planes5: data5,
      // sources is an array of data sources with weights; add more entries to support more datasets
      sources: [
        { items: data1, weight: 0.05, keyPrefix: 'd1' },
        { items: data5, weight: 0.9, keyPrefix: 'd5' },
      ],
      mixedPlanes: [],
      selectedItem: null,
      userGuess: '',
      correctGuesses: [],
      isCorrect: false,
      feedbackMessage: '',
    };
    this.intervalId = null;
  }

  componentDidMount() {
    this.loadCorrectGuesses();
    this.loadSelectedItem();  // NEW: Load persisted selectedItem
    this.loadUserState();     // NEW: Load userGuess, etc. (optional)
    this.checkAndGenerateItem();
    this.startAutoTimer();
  }

  componentWillUnmount() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
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
      if (lastTimestamp) {
        const elapsed = Date.now() - parseInt(lastTimestamp);
        if (elapsed >= AUTO_PLANE_INTERVAL) {
          this.generateSingle();
        } else {
          this.generateSingle();
        }
      } else {
        this.generateSingle();
      }
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

  // NEW: Persist selectedItem
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

  // NEW: Optional - persist user state for full UX
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

  saveCorrectGuess = async (guessedName) => {
    try {
      const { correctGuesses } = this.state;
      const updated = [...correctGuesses, { name: guessedName, timestamp: new Date().toISOString() }];
      await AsyncStorage.setItem('correctGuesses', JSON.stringify(updated));
      this.setState({ correctGuesses: updated });
    } catch (error) {
      console.error('Error saving correct guess:', error);
    }
  };

  getItemByName = (name) => {
    const allData = [...this.state.planes, ...this.state.planes5];
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
    // Check if guess matches any of the three options or the name
    const validGuesses = [
      item.name.toLowerCase(),
      item.guess1.toLowerCase(),
      item.guess2.toLowerCase(),
      item.guess3.toLowerCase(),
    ];
    if (validGuesses.includes(userInputLower)) {
      this.setState({
        isCorrect: true,
        feedbackMessage: '✓ Correct! Saved permanently!',
        userGuess: ''
      });
      this.saveCorrectGuess(guessText);
      // NEW: Clear persisted item after correct guess
      AsyncStorage.removeItem('selectedItem');
      setTimeout(() => {
        this.setState({ isCorrect: false, feedbackMessage: '' });
        this.generateSingle();
        this.setState({ userGuess: '' });
      }, 2000);
    } else {
      this.setState({
        isCorrect: false,
        feedbackMessage: '✗ Incorrect. Try again!',
        userGuess: ''
      });
      // NEW: Save user state on incorrect guess
      this.saveUserState();
      setTimeout(() => {
        this.setState({ feedbackMessage: '' });
      }, 1500);
    }
  };

  handleGuessButton = (guess) => {
    this.handleGuess(guess);
  };

  // Generate a mixed array from configured `sources` using their weights.
  generateMixed = (size) => {
    const sources = this.state.sources || [];
    if (!sources.length) return this.setState({ mixedPlanes: [] });
    // normalize weights
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
      // pick source by cumulative weights
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

  // pick a single item using the configured source weights
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
    const r = Math.random();
    let idx = 0;
    while (idx < cumulative.length && r > cumulative[idx]) idx++;
    const chosen = sources[Math.min(idx, sources.length - 1)];
    const pool = chosen.items || [];
    if (!pool.length) return this.setState({ selectedItem: null });
    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.setState({ selectedItem: Object.assign({}, pick, { _mixedKey: `${chosen.keyPrefix || 's'}-single-${pick.id}` }) }, () => {
      this.saveItemTimestamp();
      this.saveSelectedItem(pick);  // NEW: Persist after generating
    });
  };

  render() {
    const { selectedItem, userGuess, isCorrect, feedbackMessage } = this.state;
    return (
      <ScrollView style={styles.container}>
        {selectedItem ? (
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
          <Text style={{ textAlign: 'center', margin: 12 }}>No item</Text>
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
});
