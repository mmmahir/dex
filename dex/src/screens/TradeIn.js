import React, { Component } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, Dimensions, Modal, Animated, Easing,
  Pressable, Image, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import data1 from '../data/t1.json';
import data2 from '../data/t2.json';
import data3 from '../data/t3.json';
import data4 from '../data/t4.json';
import data5 from '../data/t5.json';

const ALL_DATA = [...data1, ...data2, ...data3, ...data4, ...data5];

const TIER_COLORS = {
  1: { bg: '#ca8f0f', border: '#a0700a', label: 'LEGENDARY' },
  2: { bg: '#9b59b6', border: '#7d3c98', label: 'EPIC' },
  3: { bg: '#2980b9', border: '#1a5276', label: 'RARE' },
  4: { bg: '#27ae60', border: '#1e8449', label: 'UNCOMMON' },
  5: { bg: '#7f8c8d', border: '#616a6b', label: 'COMMON' },
};

// 5 of tier X → 1 of tier X-1 (lower number = higher rarity)
const TRADE_UP = { 5: 4, 4: 3, 3: 2, 2: 1 };
const REQUIRED = 5;

const getMetrics = () => {
  const { width } = Dimensions.get('window');
  const cardW = width / 3 - 20;
  return { width, cardW, cardH: cardW * 1.4 };
};

export default class Trade extends Component {
  constructor(props) {
    super(props);
    this.state = {
      correctGuesses: [],
      selectedTier: 5,
      selectedCards: [],   // indices into correctGuesses of chosen cards
      rewardCard: null,
      rewardVisible: false,
    };
    this.rewardAnim  = new Animated.Value(0);
    this.shakeAnim   = new Animated.Value(0);
    this.glowAnim    = new Animated.Value(0);
  }

  componentDidMount() {
    this.loadGuesses();
    this.props.navigation.addListener('focus', this.loadGuesses);
  }

  loadGuesses = async () => {
    try {
      const saved = await AsyncStorage.getItem('correctGuesses');
      this.setState({ correctGuesses: saved ? JSON.parse(saved) : [] });
    } catch (e) {}
  };

  // Build a list of { item, guessIndex } for the selected tier
  getCardsForTier = () => {
    const { correctGuesses, selectedTier } = this.state;
    return correctGuesses
      .map((g, i) => {
        const item = ALL_DATA.find(d => d.DEXid === g.DEXid);
        return item ? { item, guessIndex: i } : null;
      })
      .filter(Boolean)
      .filter(({ item }) => item.tier === selectedTier);
  };

  toggleSelect = (guessIndex) => {
    const { selectedCards } = this.state;
    if (selectedCards.includes(guessIndex)) {
      this.setState({ selectedCards: selectedCards.filter(i => i !== guessIndex) });
    } else {
      if (selectedCards.length >= REQUIRED) {
        // shake to indicate limit
        Animated.sequence([
          Animated.timing(this.shakeAnim, { toValue: 8,  duration: 50, useNativeDriver: true }),
          Animated.timing(this.shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(this.shakeAnim, { toValue: 6,  duration: 50, useNativeDriver: true }),
          Animated.timing(this.shakeAnim, { toValue: 0,  duration: 50, useNativeDriver: true }),
        ]).start();
        return;
      }
      this.setState({ selectedCards: [...selectedCards, guessIndex] });
    }
  };

  executeTrade = async () => {
    const { correctGuesses, selectedCards, selectedTier } = this.state;
    if (selectedCards.length < REQUIRED) return;

    const targetTier = TRADE_UP[selectedTier];
    if (!targetTier) return;

    // Pick a random card from the target tier
    const pool = ALL_DATA.filter(d => d.tier === targetTier);
    if (!pool.length) return;
    const reward = pool[Math.floor(Math.random() * pool.length)];

    // Remove the 5 selected guesses (by index, high→low so indices stay valid)
    const sortedIndices = [...selectedCards].sort((a, b) => b - a);
    let updated = [...correctGuesses];
    for (const idx of sortedIndices) {
      updated.splice(idx, 1);
    }

    // Add the reward
    updated.push({ DEXid: reward.DEXid, name: reward.name, timestamp: new Date().toISOString() });

    try {
      await AsyncStorage.setItem('correctGuesses', JSON.stringify(updated));
    } catch (e) {}

    this.setState({
      correctGuesses: updated,
      selectedCards: [],
      rewardCard: reward,
      rewardVisible: true,
    }, () => {
      this.rewardAnim.setValue(0);
      this.glowAnim.setValue(0);
      Animated.parallel([
        Animated.spring(this.rewardAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(this.glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(this.glowAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
          ])
        ),
      ]).start();
    });
  };

  closeReward = () => {
    Animated.timing(this.rewardAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      this.setState({ rewardVisible: false, rewardCard: null });
    });
  };

  render() {
    const { selectedTier, selectedCards, rewardVisible, rewardCard } = this.state;
    const { width, cardW, cardH } = getMetrics();
    const cards = this.getCardsForTier();
    const targetTier = TRADE_UP[selectedTier];
    const targetColors = TIER_COLORS[targetTier] || TIER_COLORS[1];
    const srcColors = TIER_COLORS[selectedTier];
    const canTrade = selectedCards.length === REQUIRED && !!targetTier;

    const rewardScale = this.rewardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
    const glowOpacity = this.glowAnim;

    return (
      <View style={styles.root}>

        {/* ── Header ── */}
        <View style={styles.hud}>
          <View style={styles.hudTitleRow}>
            <MaterialCommunityIcons name="swap-horizontal-bold" size={18} color="#ca8f0f" />
            <Text style={styles.hudTitle}>TRADE-IN</Text>
          </View>
          <Text style={styles.hudSub}>
            Trade {REQUIRED} cards of the same tier for 1 higher tier card
          </Text>
        </View>

        {/* ── Tier selector ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tierBar}
          contentContainerStyle={styles.tierBarContent}
        >
          {Object.entries(TRADE_UP).reverse().map(([tier]) => {
            const t = parseInt(tier);
            const c = TIER_COLORS[t];
            const active = selectedTier === t;
            // count how many of this tier the user has
            const count = this.state.correctGuesses.filter(g => {
              const item = ALL_DATA.find(d => d.DEXid === g.DEXid);
              return item?.tier === t;
            }).length;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.tierChip, active && { backgroundColor: c.bg, borderColor: c.border }]}
                onPress={() => this.setState({ selectedTier: t, selectedCards: [] })}
              >
                <View style={[styles.tierDot, { backgroundColor: c.bg }, active && { backgroundColor: '#fff' }]} />
                <Text style={[styles.tierChipText, active && { color: '#fff' }]}>{c.label}</Text>
                <Text style={[styles.tierChipCount, active && { color: '#ffffffcc' }]}>{count}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Trade summary bar ── */}
        <View style={styles.tradeBar}>
          {/* Source */}
          <View style={styles.tradeBarSide}>
            <View style={[styles.tradeBarPill, { backgroundColor: srcColors.bg + '22', borderColor: srcColors.border }]}>
              <Text style={[styles.tradeBarLabel, { color: srcColors.bg }]}>{srcColors.label}</Text>
            </View>
            <Text style={styles.tradeBarCount}>
              <Text style={{ color: selectedCards.length === REQUIRED ? '#ca8f0f' : '#fff' }}>
                {selectedCards.length}
              </Text>
              <Text style={styles.tradeBarOf}> / {REQUIRED}</Text>
            </Text>
          </View>

          {/* Arrow */}
          <View style={styles.tradeArrow}>
            <MaterialCommunityIcons name="arrow-right-bold" size={22} color={canTrade ? '#ca8f0f' : '#2a2a3a'} />
          </View>

          {/* Target */}
          <View style={styles.tradeBarSide}>
            {targetTier ? (
              <>
                <View style={[styles.tradeBarPill, { backgroundColor: targetColors.bg + '22', borderColor: targetColors.border }]}>
                  <Text style={[styles.tradeBarLabel, { color: targetColors.bg }]}>{targetColors.label}</Text>
                </View>
                <Text style={styles.tradeBarCount}>×1</Text>
              </>
            ) : (
              <Text style={styles.tradeBarLabel}>MAX TIER</Text>
            )}
          </View>

          {/* Trade button */}
          <TouchableOpacity
            style={[styles.tradeBtn, !canTrade && styles.tradeBtnOff]}
            onPress={canTrade ? this.executeTrade : undefined}
            activeOpacity={canTrade ? 0.75 : 1}
          >
            <MaterialCommunityIcons name="swap-horizontal-bold" size={16} color={canTrade ? '#0a0a0f' : '#333'} />
            <Text style={[styles.tradeBtnText, !canTrade && { color: '#333' }]}>TRADE</Text>
          </TouchableOpacity>
        </View>

        {/* ── Card grid ── */}
        {cards.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="card-off-outline" size={52} color="#2a2a3a" />
            <Text style={styles.emptyTitle}>NO {srcColors.label} CARDS</Text>
            <Text style={styles.emptySub}>Identify aircraft on the radar to collect cards</Text>
          </View>
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(item, i) => `${item.item.DEXid}-${item.guessIndex}-${i}`}
            numColumns={3}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={styles.gridHint}>Tap to select · {REQUIRED} required to trade</Text>
            }
            renderItem={({ item: { item, guessIndex } }) => {
              const selected = selectedCards.includes(guessIndex);
              const colors = TIER_COLORS[item.tier] || TIER_COLORS[5];
              return (
                <Animated.View style={selected ? { transform: [{ translateX: this.shakeAnim }] } : {}}>
                  <TouchableOpacity
                    onPress={() => this.toggleSelect(guessIndex)}
                    activeOpacity={0.8}
                    style={[
                      styles.miniCard,
                      { width: cardW, height: cardH, backgroundColor: colors.bg, borderColor: selected ? '#fff' : colors.border },
                      selected && styles.miniCardSelected,
                    ]}
                  >
                    {/* Selected overlay */}
                    {selected && (
                      <View style={styles.selectedOverlay}>
                        <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
                      </View>
                    )}
                    <View style={[styles.miniTierBadge, { backgroundColor: colors.border }]}>
                      <Text style={styles.miniTierText}>{colors.label}</Text>
                    </View>
                    <Image
                      source={{ uri: item.image }}
                      style={[styles.miniImage, { height: cardH * 0.42 }]}
                      resizeMode="cover"
                    />
                    <Text style={[styles.miniName, { fontSize: Math.max(9, cardW * 0.09) }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            }}
          />
        )}

        {/* ── Reward modal ── */}
        <Modal visible={rewardVisible} transparent animationType="none" statusBarTranslucent onRequestClose={this.closeReward}>
          <Pressable style={styles.rewardBackdrop} onPress={this.closeReward}>
            <Animated.View style={[styles.rewardModal, { opacity: this.rewardAnim, transform: [{ scale: rewardScale }] }]}>
              <Pressable onPress={e => e.stopPropagation()}>

                {rewardCard && (() => {
                  const rc = TIER_COLORS[rewardCard.tier] || TIER_COLORS[1];
                  return (
                    <>
                      <View style={[styles.rewardBar, { backgroundColor: rc.bg }]} />

                      <Text style={styles.rewardHeading}>TRADE SUCCESS!</Text>
                      <View style={[styles.rewardDivider, { backgroundColor: rc.bg }]} />
                      <Text style={styles.rewardSubheading}>YOU RECEIVED</Text>

                      {/* Glowing card */}
                      <View style={styles.rewardCardWrap}>
                        <Animated.View style={[styles.rewardGlow, { backgroundColor: rc.bg, opacity: glowOpacity }]} />
                        <View style={[styles.rewardCard, { backgroundColor: rc.bg, borderColor: rc.border }]}>
                          <View style={[styles.rewardTierBadge, { backgroundColor: rc.border }]}>
                            <Text style={styles.rewardTierText}>{rc.label}</Text>
                          </View>
                          <Image source={{ uri: rewardCard.image }} style={styles.rewardImage} resizeMode="cover" />
                          <Text style={styles.rewardName}>{rewardCard.name}</Text>
                          <Text style={styles.rewardDexId}>{rewardCard.DEXid}</Text>
                        </View>
                      </View>

                      <TouchableOpacity style={[styles.rewardBtn, { backgroundColor: rc.bg }]} onPress={this.closeReward}>
                        <Text style={styles.rewardBtnText}>COLLECT</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}

              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },

  // Header
  hud: {
    backgroundColor: '#0d0d14',
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  hudTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  hudTitle: {
    color: '#ca8f0f',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },
  hudSub: {
    color: '#333',
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Tier selector
  tierBar: {
    backgroundColor: '#0d0d14',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
    maxHeight: 58,
  },
  tierBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#3a3a4a',
    backgroundColor: '#16161f',
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierChipText: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  tierChipCount: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#0a0a0f',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },

  // Trade summary bar
  tradeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d0d14',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  tradeBarSide: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tradeBarPill: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tradeBarLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  tradeBarCount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  tradeBarOf: {
    color: '#333',
    fontSize: 13,
  },
  tradeArrow: {
    paddingHorizontal: 4,
  },
  tradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ca8f0f',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
  },
  tradeBtnOff: {
    backgroundColor: '#16161f',
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  tradeBtnText: {
    color: '#0a0a0f',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  // Grid
  grid: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 30,
  },
  gridHint: {
    color: '#2a2a3a',
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'center',
    paddingVertical: 10,
  },

  // Mini card
  miniCard: {
    borderRadius: 8,
    borderWidth: 2,
    margin: 5,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 6,
  },
  miniCardSelected: {
    borderWidth: 2.5,
    shadowColor: '#fff',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 5,
    zIndex: 10,
  },
  miniTierBadge: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 2,
  },
  miniTierText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },
  miniImage: {
    width: '88%',
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: '#00000033',
  },
  miniName: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: 10,
  },
  emptyTitle: {
    color: '#2a2a3a',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 4,
  },
  emptySub: {
    color: '#222',
    fontSize: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Reward modal
  rewardBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardModal: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: '#0d0d14',
    borderWidth: 1,
    borderColor: '#1e1e2e',
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
  },
  rewardBar: {
    width: '100%',
    height: 3,
  },
  rewardHeading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 22,
    textAlign: 'center',
  },
  rewardDivider: {
    width: 32,
    height: 2,
    marginVertical: 10,
    alignSelf: 'center',
  },
  rewardSubheading: {
    color: '#555',
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: 16,
  },
  rewardCardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  rewardGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.15,
  },
  rewardCard: {
    width: 170,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 10,
  },
  rewardTierBadge: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rewardTierText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  rewardImage: {
    width: '88%',
    height: 110,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#00000033',
  },
  rewardName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  rewardDexId: {
    color: '#ffffff66',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 3,
  },
  rewardBtn: {
    marginBottom: 20,
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 4,
  },
  rewardBtnText: {
    color: '#0a0a0f',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },
});