import React, { Component } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/card';
import data1 from '../data/t1.json';
import data5 from '../data/t5.json';

export default class Dex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      correctGuesses: [],
      guessedItems: [],
      planes: data1,
      planes5: data5,
    };
  }

  componentDidMount() {
    this.loadCorrectGuesses();
    // Set up a listener to refresh when the screen comes into focus
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
    const allData = [...this.state.planes, ...this.state.planes5];
    return allData.find(item => 
      item.name.toLowerCase() === name.toLowerCase() ||
      item.guess1.toLowerCase() === name.toLowerCase() ||
      item.guess2.toLowerCase() === name.toLowerCase() ||
      item.guess3.toLowerCase() === name.toLowerCase()
    );
  };

  getGuessedItems = (guesses) => {
    const items = guesses.map(guess => this.getItemByName(guess.name)).filter(item => item);
    this.setState({ guessedItems: items });
  };

  render() {
    const { guessedItems, correctGuesses } = this.state;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>DEX</Text>
          <Text style={styles.headerSubtitle}>Correctly Guessed: {correctGuesses.length}</Text>
        </View>

        {guessedItems.length > 0 ? (
          <FlatList
            data={guessedItems}
            keyExtractor={(item, index) => `${item.id}-${index}`}
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
});
