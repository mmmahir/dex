import React, { Component } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../components/card';
import data1 from '../data/t1.json';
import data4 from '../data/t4.json';
import data5 from '../data/t5.json';
import data3 from '../data/t3.json';
import data2 from '../data/t2.json';

const getMetrics = () => {
  const { width } = Dimensions.get('window');
  return { screenWidth: width };
};

const getTier = (item) => {
  if (item.tier) return item.tier;
  if (!item.DEXid) return 99;
  return parseInt(item.DEXid.replace('#', '')[0]) || 99;
};

const SORT_OPTIONS = [
  { key: 'newest',         label: 'Newest',   icon: 'clock-outline' },
  { key: 'oldest',         label: 'Oldest',   icon: 'clock-check-outline' },
  { key: 'rarity',         label: 'Rarity ↑', icon: 'star' },
  { key: 'rarity_reverse', label: 'Rarity ↓', icon: 'star-outline' },
  { key: 'name',           label: 'A–Z',      icon: 'sort-alphabetical-ascending' },
];

export default class Dex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      correctGuesses: [],
      guessedItems: [],
      sortKey: 'newest',
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
    this.dimensionListener = Dimensions.addEventListener('change', () => { this.forceUpdate(); });
  }

  componentWillUnmount() {
    if (this.dimensionListener) this.dimensionListener.remove?.();
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
    const items = guesses.map((guess, index) => {
      let item;
      if (guess.DEXid) {
        item = allData.find(i => i.DEXid === guess.DEXid);
      } else {
        item = this.getItemByName(guess.name);
      }
      return item ? { ...item, _guessIndex: index } : null;
    }).filter(Boolean);
    this.setState({ guessedItems: items });
  };

  getSortedItems = () => {
    const { guessedItems, sortKey } = this.state;
    const items = [...guessedItems];
    switch (sortKey) {
      case 'newest':
        return items.sort((a, b) => b._guessIndex - a._guessIndex);
      case 'oldest':
        return items.sort((a, b) => a._guessIndex - b._guessIndex);
      case 'rarity':
        return items.sort((a, b) => getTier(a) - getTier(b));
      case 'rarity_reverse':
        return items.sort((a, b) => getTier(b) - getTier(a));
      case 'name':
        return items.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return items;
    }
  };

  deleteItem = async (DEXid) => {
    try {
      const saved = await AsyncStorage.getItem('correctGuesses');
      const currentGuesses = saved ? JSON.parse(saved) : [];
      const updated = currentGuesses.filter(g => g.DEXid !== DEXid);
      await AsyncStorage.setItem('correctGuesses', JSON.stringify(updated));
      this.setState({ correctGuesses: updated });
      this.getGuessedItems(updated);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
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
              this.setState({ correctGuesses: [], guessedItems: [] });
              await AsyncStorage.multiRemove([
                'correctGuesses', 'selectedItem', 'lastItemTimestamp',
                'waitingForNext', 'userGuess', 'isCorrect', 'feedbackMessage',
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
    const { correctGuesses, sortKey } = this.state;
    const { screenWidth } = getMetrics();
    const headerTitleSize = Math.max(24, screenWidth * 0.075);
    const headerSubSize = Math.max(13, screenWidth * 0.038);
    const sortedItems = this.getSortedItems();

    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>DEX</Text>
          <Text style={[styles.headerSubtitle, { fontSize: headerSubSize }]}>
            Correctly Guessed: {correctGuesses.length}
          </Text>
          <TouchableOpacity style={styles.clearButton} onPress={this.clearData}>
            <Text style={[styles.clearButtonText, { fontSize: Math.max(12, screenWidth * 0.035) }]}>🗑 Clear Data</Text>
          </TouchableOpacity>
        </View>

        {/* Sort bar */}
        {sortedItems.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sortBar}
            contentContainerStyle={styles.sortBarContent}
          >
            {SORT_OPTIONS.map(opt => {
              const active = sortKey === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sortChip, active && styles.sortChipActive]}
                  onPress={() => this.setState({ sortKey: opt.key })}
                >
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={15}
                    color={active ? '#fff' : '#ca8f0f'}
                  />
                  <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Grid */}
        {sortedItems.length > 0 ? (
          <FlatList
            data={sortedItems}
            keyExtractor={(item, index) => `${item.DEXid}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <Card
                  name={item.name}
                  description={item.description}
                  attack={item.attack}
                  defense={item.defense}
                  image={item.image}
                  DEXid={item.DEXid}
                  tier={item.tier}
                  onDelete={this.deleteItem}
                />
              </View>
            )}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.flatListContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { fontSize: Math.max(13, screenWidth * 0.040) }]}>
              No items guessed yet. Go guess some items!
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
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#ca8f0f',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
  },
  headerSubtitle: {
    color: '#fff',
    marginTop: 6,
  },
  clearButton: {
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sortBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  sortBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ca8f0f',
    backgroundColor: '#fff',
  },
  sortChipActive: {
    backgroundColor: '#ca8f0f',
    borderColor: '#ca8f0f',
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ca8f0f',
  },
  sortChipTextActive: {
    color: '#fff',
  },
  flatListContent: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 20,
  },
  cardWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    lineHeight: 26,
  },
});