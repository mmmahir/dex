import React, { Component } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/card';
import data1 from '../data/t1.json';
import data4 from '../data/t4.json';
import data5 from '../data/t5.json';
import data3 from '../data/t3.json';
import data2 from '../data/t2.json';

export default class Dex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      correctGuesses: [],
      guessedItems: [],
      planes: data1,
      planes4: data4,
      planes5: data5,
      planes3: data3,
      planes2: data2,
    };
  }

  componentDidMount() {
    this.loadCorrectGuesses();
    this.props.navigation.addListener('focus', this.loadCorrectGuesses);
  }

  loadCorrectGuesses = async () => {
    try {
      const saved = await AsyncStorage.getItem('correctGuesses');
      if (saved) {
        const guesses = JSON.parse(saved);
        this.setState({ correctGuesses: guesses });
        this.getGuessedItems(guesses);
      }
    } catch (error) {
      console.error('Error loading correct guesses:', error);
    }
  };

  getItemByName = (name) => {
    const allData = [...this.state.planes, ...this.state.planes4, ...this.state.planes5, ...this.state.planes3, ...this.state.planes2];
    return allData.find(item =>
      item.name.toLowerCase() === name.toLowerCase() ||
      item.guess1.toLowerCase() === name.toLowerCase() ||
      item.guess2.toLowerCase() === name.toLowerCase() ||
      item.guess3.toLowerCase() === name.toLowerCase()
    );
  };

  getGuessedItems = (guesses) => {
    const allData = [...this.state.planes, ...this.state.planes4, ...this.state.planes5, ...this.state.planes3, ...this.state.planes2];
    const items = guesses.map(guess => {
      if (guess.DEXid) {
        // Match by DEXid for precise lookup (e.g. distinguishes Bf 109 B-1 from C-1)
        return allData.find(item => item.DEXid === guess.DEXid);
      }
      // Fallback for old saves that only have name
      return this.getItemByName(guess.name);
    }).filter(item => item);
    // Reverse so newest guesses appear first (top-left)
    this.setState({ guessedItems: items.reverse() });
  };

  clearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your guesses and progress. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear state first
              this.setState({ correctGuesses: [], guessedItems: [] });
              // Then clear AsyncStorage
              await AsyncStorage.multiRemove([
                'correctGuesses',
                'selectedItem',
                'lastItemTimestamp',
                'waitingForNext',
                'userGuess',
                'isCorrect',
                'feedbackMessage',
              ]);
            } catch (error) {
              console.error('Error clearing data:', error);
            }
          },
        },
      ]
    );
  };

  render() {
    const { guessedItems, correctGuesses } = this.state;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>DEX</Text>
          <Text style={styles.headerSubtitle}>Correctly Guessed: {correctGuesses.length}</Text>
          <TouchableOpacity style={styles.clearButton} onPress={this.clearData}>
            <Text style={styles.clearButtonText}>🗑 Clear Data</Text>
          </TouchableOpacity>
        </View>

        {guessedItems.length > 0 ? (
          <FlatList
            data={guessedItems}
            keyExtractor={(item, index) => `${item.DEXid}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <Card
                  name={item.name}
                  description={item.description}
                  attack={item.attack}
                  defense={item.defense}
                  image={item.image}
                />
              </View>
            )}
            numColumns={2}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items guessed yet. Go guess some items!</Text>
          </View>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#ca8f0f',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
  },
  cardWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  clearButton: {
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});