import React, { Component } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/card';
import data1 from '../data/t1.json';
import data4 from '../data/t4.json';
import data5 from '../data/t5.json';

export default class Dex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      correctGuesses: [],
      guessedItems: [],
      planes: data1,
      planes4: data4,
      planes5: data5,
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
    const allData = [...this.state.planes, ...this.state.planes4, ...this.state.planes5];
    return allData.find(item =>
      item.name.toLowerCase() === name.toLowerCase() ||
      item.guess1.toLowerCase() === name.toLowerCase() ||
      item.guess2.toLowerCase() === name.toLowerCase() ||
      item.guess3.toLowerCase() === name.toLowerCase()
    );
  };

  getGuessedItems = (guesses) => {
    const allData = [...this.state.planes, ...this.state.planes4, ...this.state.planes5];
    const items = guesses.map(guess => {
      console.log('Looking up guess:', guess);
      if (guess.DEXid) {
        // Match by DEXid for precise lookup (e.g. distinguishes Bf 109 B-1 from C-1)
        const found = allData.find(item => item.DEXid === guess.DEXid);
        console.log('Found by DEXid:', found?.name, found?.DEXid);
        return found;
      }
      // Fallback for old saves that only have name
      const found = this.getItemByName(guess.name);
      console.log('Found by name:', found?.name, found?.DEXid);
      return found;
    }).filter(item => item);
    this.setState({ guessedItems: items });
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
              await AsyncStorage.multiRemove([
                'correctGuesses',
                'selectedItem',
                'lastItemTimestamp',
                'waitingForNext',
                'userGuess',
                'isCorrect',
                'feedbackMessage',
              ]);
              this.setState({ correctGuesses: [], guessedItems: [] });
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
            keyExtractor={(item, index) => `${item.id}-${index}`}
            inverted={true}
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