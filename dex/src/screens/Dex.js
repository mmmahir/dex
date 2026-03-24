import React, { Component } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  TouchableOpacity, Alert, Dimensions, Animated, Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../components/card';
import data1 from '../data/t1.json';
import data4 from '../data/t4.json';
import data5 from '../data/t5.json';
import data3 from '../data/t3.json';
import data2 from '../data/t2.json';

const ALL_DATA = [...data1, ...data2, ...data3, ...data4, ...data5];
const TOTAL_PLANES = ALL_DATA.length;

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
  { key: 'newest',         label: 'NEWEST',   icon: 'clock-outline' },
  { key: 'oldest',         label: 'OLDEST',   icon: 'clock-check-outline' },
  { key: 'rarity',         label: 'RARITY ↑', icon: 'star' },
  { key: 'rarity_reverse', label: 'RARITY ↓', icon: 'star-outline' },
  { key: 'name',           label: 'A – Z',    icon: 'sort-alphabetical-ascending' },
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
    this.progressAnim = new Animated.Value(0);
  }

  componentDidMount() {
    this.loadCorrectGuesses();
    this.props.navigation.addListener('focus', this.loadCorrectGuesses);
    this.dimensionListener = Dimensions.addEventListener('change', () => { this.forceUpdate(); });
  }

  componentWillUnmount() {
    if (this.dimensionListener) this.dimensionListener.remove?.();
  }

  animateProgress = (count) => {
    Animated.timing(this.progressAnim, {
      toValue: count / TOTAL_PLANES,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  loadCorrectGuesses = async () => {
    try {
      const saved = await AsyncStorage.getItem('correctGuesses');
      if (saved) {
        const guesses = JSON.parse(saved);
        this.setState({ correctGuesses: guesses });
        this.getGuessedItems(guesses);
        this.animateProgress(guesses.length);
      } else {
        this.animateProgress(0);
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
      case 'newest':        return items.sort((a, b) => b._guessIndex - a._guessIndex);
      case 'oldest':        return items.sort((a, b) => a._guessIndex - b._guessIndex);
      case 'rarity':        return items.sort((a, b) => getTier(a) - getTier(b));
      case 'rarity_reverse':return items.sort((a, b) => getTier(b) - getTier(a));
      case 'name':          return items.sort((a, b) => a.name.localeCompare(b.name));
      default:              return items;
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
      this.animateProgress(updated.length);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  clearData = () => {
    Alert.alert(
      'DELETE ALL',
      'This will delete all confirmed identifications. Are you sure?',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DELETE ALL',
          style: 'destructive',
          onPress: async () => {
            try {
              this.setState({ correctGuesses: [], guessedItems: [] });
              this.animateProgress(0);
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
    const sortedItems = this.getSortedItems();
    const pct = Math.round((correctGuesses.length / TOTAL_PLANES) * 100);

    const progressWidth = this.progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.root}>

        {/* ── HUD Header ── */}
        <View style={styles.hud}>
          <View style={styles.hudTop}>
            <View style={styles.hudTitleRow}>
              <MaterialCommunityIcons name="book-open-variant" size={18} color="#ca8f0f" />
              <Text style={styles.hudTitle}>DEX</Text>
            </View>
            <TouchableOpacity style={styles.purgeBtn} onPress={this.clearData}>
              <MaterialCommunityIcons name="trash-can-outline" size={14} color="#f44336" />
              <Text style={styles.purgeBtnText}>DELETE ALL</Text>
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{correctGuesses.length}</Text>
              <Text style={styles.statLabel}>CONFIRMED</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{TOTAL_PLANES - correctGuesses.length}/{TOTAL_PLANES}</Text>
              <Text style={styles.statLabel}>REMAINING</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pct}%</Text>
              <Text style={styles.statLabel}>COMPLETE</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            <View style={styles.progressTicks}>
              {[25, 50, 75].map(t => (
                <View key={t} style={[styles.progressTick, { left: `${t}%` }]} />
              ))}
            </View>
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>0</Text>
            <Text style={styles.progressLabel}>25%</Text>
            <Text style={styles.progressLabel}>50%</Text>
            <Text style={styles.progressLabel}>75%</Text>
            <Text style={styles.progressLabel}>{TOTAL_PLANES}</Text>
          </View>
        </View>

        {/* ── Grid with sort bar as header ── */}
        {sortedItems.length > 0 ? (
          <FlatList
            data={sortedItems}
            keyExtractor={(item, index) => `${item.DEXid}-${index}`}
            ListHeaderComponent={
              <View style={styles.sortBar}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
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
                        <MaterialCommunityIcons name={opt.icon} size={14} color={active ? '#ca8f0f' : '#aaa'} />
                        <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            }
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
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-hidden" size={56} color="#2a2a3a" />
            <Text style={styles.emptyTitle}>NO RECORDS</Text>
            <View style={styles.emptyDivider} />
            <Text style={styles.emptySubtitle}>
              Identify aircraft on the radar{'\n'}to populate this dex
            </Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },

  // HUD
  hud: {
    backgroundColor: '#0d0d14',
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  hudTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hudTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hudTitle: { color: '#ca8f0f', fontSize: 13, fontWeight: '900', letterSpacing: 3 },
  purgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#f4433644',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  purgeBtnText: { color: '#f44336', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#1e1e2e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#0a0a0f' },
  statDivider: { width: 1, backgroundColor: '#1e1e2e' },
  statValue: { color: '#ca8f0f', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  statLabel: { color: '#333', fontSize: 8, letterSpacing: 2, marginTop: 2, fontWeight: '700' },

  // Progress bar
  progressTrack: {
    height: 4,
    backgroundColor: '#1e1e2e',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: '#ca8f0f', borderRadius: 2 },
  progressTicks: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  progressTick: { position: 'absolute', width: 1, height: '100%', backgroundColor: '#0a0a0f' },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  progressLabel: { color: '#333', fontSize: 8, letterSpacing: 1, fontWeight: '600' },

  // Sort bar
  sortBar: {
    backgroundColor: '#0d0d14',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  sortBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#3a3a4a',
    backgroundColor: '#16161f',
  },
  sortChipActive: {
    borderColor: '#ca8f0f',
    backgroundColor: '#ca8f0f22',
  },
  sortChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: '#aaa' },
  sortChipTextActive: { color: '#ca8f0f' },

  // Grid
  grid: { paddingHorizontal: 8, paddingTop: 12, paddingBottom: 30 },
  cardWrapper: { flex: 1, alignItems: 'center' },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    color: '#2a2a3a',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 5,
    marginTop: 20,
  },
  emptyDivider: {
    width: 30,
    height: 2,
    backgroundColor: '#ca8f0f44',
    marginVertical: 12,
  },
  emptySubtitle: {
    color: '#333',
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 20,
  },
});