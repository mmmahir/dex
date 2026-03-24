import React, { Component } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  TouchableOpacity, Dimensions, TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../components/card';
import data1 from '../data/t1.json';
import data2 from '../data/t2.json';
import data3 from '../data/t3.json';
import data4 from '../data/t4.json';
import data5 from '../data/t5.json';

const ALL_CARDS = [
  ...data1,
  ...data2,
  ...data3,
  ...data4,
  ...data5,
];

const TIER_LABELS = {
  1: 'LEGENDARY',
  2: 'EPIC',
  3: 'RARE',
  4: 'UNCOMMON',
  5: 'COMMON',
};

const TIER_COLORS = {
  1: '#ca8f0f',
  2: '#9b59b6',
  3: '#2980b9',
  4: '#27ae60',
  5: '#7f8c8d',
};

const FILTER_OPTIONS = [
  { key: 'all',  label: 'All',       icon: 'view-grid' },
  { key: '1',    label: 'Legendary', icon: 'star' },
  { key: '2',    label: 'Epic',      icon: 'star-half-full' },
  { key: '3',    label: 'Rare',      icon: 'diamond' },
  { key: '4',    label: 'Uncommon',  icon: 'cards' },
  { key: '5',    label: 'Common',    icon: 'card-outline' },
];

const getMetrics = () => {
  const { width } = Dimensions.get('window');
  return { screenWidth: width };
};

export default class Collection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: 'all',
      search: '',
    };
  }

  componentDidMount() {
    this.dimensionListener = Dimensions.addEventListener('change', () => { this.forceUpdate(); });
  }

  componentWillUnmount() {
    if (this.dimensionListener) this.dimensionListener.remove?.();
  }

  getFilteredCards = () => {
    const { filter, search } = this.state;
    let cards = ALL_CARDS;

    if (filter !== 'all') {
      cards = cards.filter(c => String(c.tier) === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      cards = cards.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.guess1.toLowerCase().includes(q) ||
        c.guess2.toLowerCase().includes(q) ||
        c.guess3.toLowerCase().includes(q)
      );
    }

    return cards;
  };

  render() {
    const { filter, search } = this.state;
    const { screenWidth } = getMetrics();
    const cards = this.getFilteredCards();
    const totalCount = ALL_CARDS.length;

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontSize: Math.max(24, screenWidth * 0.075) }]}>
            COLLECTION
          </Text>
          <Text style={[styles.headerSub, { fontSize: Math.max(13, screenWidth * 0.036) }]}>
            {totalCount} planes total
          </Text>

          {/* Search bar */}
          <View style={styles.searchRow}>
            <MaterialCommunityIcons name="magnify" size={20} color="#fff" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { fontSize: Math.max(13, screenWidth * 0.036) }]}
              placeholder="Search planes..."
              placeholderTextColor="#ffffff88"
              value={search}
              onChangeText={text => this.setState({ search: text })}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => this.setState({ search: '' })}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tier filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          {FILTER_OPTIONS.map(opt => {
            const active = filter === opt.key;
            const tierNum = parseInt(opt.key);
            const chipColor = TIER_COLORS[tierNum] || '#ca8f0f';
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: chipColor, borderColor: chipColor },
                ]}
                onPress={() => this.setState({ filter: opt.key })}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={14}
                  color={active ? '#fff' : '#555'}
                />
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results count */}
        <Text style={[styles.resultsLabel, { fontSize: Math.max(11, screenWidth * 0.030) }]}>
          Showing {cards.length} {cards.length === 1 ? 'plane' : 'planes'}
          {filter !== 'all' ? ` · ${TIER_LABELS[parseInt(filter)]}` : ''}
        </Text>

        {/* Card grid */}
        {cards.length > 0 ? (
          <FlatList
            data={cards}
            keyExtractor={item => item.DEXid}
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
                  // No onDelete — this is a read-only view
                />
              </View>
            )}
            numColumns={2}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="card-search-outline" size={60} color="#ccc" />
            <Text style={[styles.emptyText, { fontSize: Math.max(14, screenWidth * 0.040) }]}>
              No planes found
            </Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
  },
  headerSub: {
    color: '#ffffff99',
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 14,
    width: '100%',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    padding: 0,
  },
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    maxHeight: 56,
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultsLabel: {
    color: '#888',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  grid: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 30,
  },
  cardWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyText: {
    color: '#bbb',
    marginTop: 12,
  },
});