import React, { Component, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ScrollView, Image, TextInput, Animated, Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenCapture from 'expo-screen-capture';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import data1 from '../data/t1.json';
import data4 from '../data/t4.json';
import data5 from '../data/t5.json';
import data3 from '../data/t3.json';
import data2 from '../data/t2.json';

const AUTO_PLANE_INTERVAL = 20000;

const getMetrics = () => {
  const { width, height } = Dimensions.get('window');
  return { screenWidth: width, screenHeight: height };
};

// Tier accent colors
const TIER_COLORS = {
  1: '#ca8f0f',
  2: '#9b59b6',
  3: '#2980b9',
  4: '#27ae60',
  5: '#7f8c8d',
};
const TIER_LABELS = {
  1: 'LEGENDARY', 2: 'EPIC', 3: 'RARE', 4: 'UNCOMMON', 5: 'COMMON',
};

class HomeClass extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
    this.pulseAnim = new Animated.Value(1);
    this.fadeAnim = new Animated.Value(0);
    this.slideAnim = new Animated.Value(40);
    this.scanAnim = new Animated.Value(0);
  }

  componentDidMount() {
    this.loadCorrectGuesses();
    this.loadSelectedItem();
    this.loadUserState();
    this.loadWaitingForNext();
    this.checkAndGenerateItem();
    this.startAutoTimer();
    this.startPulse();
    this.startScan();
    this.focusListener = this.props.navigation?.addListener('focus', () => {
      this.loadCorrectGuesses();
    });
    this.dimensionListener = Dimensions.addEventListener('change', () => { this.forceUpdate(); });
  }

  componentWillUnmount() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.remainingTimerId) clearTimeout(this.remainingTimerId);
    if (this.focusListener) this.focusListener();
    if (this.dimensionListener) this.dimensionListener.remove?.();
  }

  startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(this.pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  };

  startScan = () => {
    Animated.loop(
      Animated.timing(this.scanAnim, { toValue: 1, duration: 2800, useNativeDriver: true, easing: Easing.linear })
    ).start();
  };

  animateIn = () => {
    this.fadeAnim.setValue(0);
    this.slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(this.fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(this.slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  startAutoTimer = () => {
    this.intervalId = setInterval(() => { this.generateSingle(); }, AUTO_PLANE_INTERVAL);
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
    } catch (error) { this.generateSingle(); }
  };

  saveItemTimestamp = async () => { try { await AsyncStorage.setItem('lastItemTimestamp', Date.now().toString()); } catch (e) {} };
  loadWaitingForNext = async () => { try { const w = await AsyncStorage.getItem('waitingForNext'); if (w === 'true') this.setState({ waitingForNext: true, selectedItem: null }); } catch (e) {} };
  saveWaitingForNext = async (v) => { try { await AsyncStorage.setItem('waitingForNext', v ? 'true' : 'false'); } catch (e) {} };
  loadSelectedItem = async () => { try { const s = await AsyncStorage.getItem('selectedItem'); if (s) this.setState({ selectedItem: JSON.parse(s) }, this.animateIn); } catch (e) {} };
  saveSelectedItem = async (item) => { try { await AsyncStorage.setItem('selectedItem', JSON.stringify(item)); } catch (e) {} };
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
  saveUserState = async () => { try { const { userGuess, isCorrect, feedbackMessage } = this.state; await AsyncStorage.setItem('userGuess', userGuess); await AsyncStorage.setItem('isCorrect', JSON.stringify(isCorrect)); await AsyncStorage.setItem('feedbackMessage', feedbackMessage); } catch (e) {} };
  loadCorrectGuesses = async () => { try { const s = await AsyncStorage.getItem('correctGuesses'); this.setState({ correctGuesses: s ? JSON.parse(s) : [] }); } catch (e) {} };

  saveCorrectGuess = async (item) => {
    try {
      const saved = await AsyncStorage.getItem('correctGuesses');
      const current = saved ? JSON.parse(saved) : [];
      const updated = [...current, { name: item.name, DEXid: item.DEXid, timestamp: new Date().toISOString() }];
      await AsyncStorage.setItem('correctGuesses', JSON.stringify(updated));
      this.setState({ correctGuesses: updated });
    } catch (e) {}
  };

  handleGuess = (guessText) => {
    if (!this.state.selectedItem) return;
    const item = this.state.selectedItem;
    const input = guessText.toLowerCase().trim();
    const valid = [item.name, item.guess1, item.guess2, item.guess3].map(g => g.toLowerCase());
    if (valid.includes(input)) {
      this.setState({ isCorrect: true, feedbackMessage: 'IDENTIFIED', userGuess: '' });
      this.saveCorrectGuess(item);
      AsyncStorage.removeItem('selectedItem');
      this.saveWaitingForNext(true);
      setTimeout(() => { this.setState({ isCorrect: false, feedbackMessage: '', selectedItem: null, waitingForNext: true }); }, 2200);
    } else {
      this.setState({ isCorrect: false, feedbackMessage: 'WRONG TARGET NAME', userGuess: '' });
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
    const selectedItem = Object.assign({}, pick, { _mixedKey: `${chosenSource.keyPrefix}-single-${pick.id}` });
    this.setState({ selectedItem, waitingForNext: false }, () => {
      this.saveItemTimestamp();
      this.saveSelectedItem(pick);
      this.saveWaitingForNext(false);
      this.animateIn();
    });
  };

  render() {
    const { selectedItem, userGuess, isCorrect, feedbackMessage, waitingForNext, correctGuesses } = this.state;
    const { screenWidth, screenHeight } = getMetrics();
    const tier = selectedItem?.tier || 5;
    const tierColor = TIER_COLORS[tier] || '#ca8f0f';
    const tierLabel = TIER_LABELS[tier] || 'COMMON';
    const imgHeight = Math.round(screenWidth * 0.55);

    const scanTranslate = this.scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-imgHeight, imgHeight] });

    return (
      <View style={styles.root}>

        {/* ── Top HUD bar ── */}
        <View style={styles.hud}>
          <View style={styles.hudLeft}>
            <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#ca8f0f" />
            <Text style={styles.hudLabel}>RADAR</Text>
          </View>
          <View style={styles.hudRight}>
            <MaterialCommunityIcons name="check-decagram" size={14} color="#4CAF50" />
            <Text style={styles.hudScore}>{correctGuesses.length} CONFIRMED</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { minHeight: screenHeight - 180 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {selectedItem && !waitingForNext ? (
            <Animated.View style={[styles.gameContainer, { opacity: this.fadeAnim, transform: [{ translateY: this.slideAnim }] }]}>

              {/* ── Tier badge ── */}
              <View style={[styles.tierBadge, { borderColor: tierColor }]}>
                <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
                <Text style={[styles.tierBadgeText, { color: tierColor }]}>{tierLabel}</Text>
              </View>

              {/* ── Image card ── */}
              <View style={[styles.imageCard, { borderColor: tierColor }]}>
                {/* Corner brackets */}
                <View style={[styles.corner, styles.cornerTL, { borderColor: tierColor }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: tierColor }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: tierColor }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: tierColor }]} />

                <Image
                  source={{ uri: selectedItem.image }}
                  style={[styles.planeImage, { height: imgHeight }]}
                  resizeMode="cover"
                />

                {/* Scan line */}
                <Animated.View
                  pointerEvents="none"
                  style={[styles.scanLine, { backgroundColor: tierColor, transform: [{ translateY: scanTranslate }] }]}
                />

                {/* Bottom overlay label */}
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageOverlayText}>IDENTIFY TARGET</Text>
                  <View style={[styles.imageOverlayLine, { backgroundColor: tierColor }]} />
                </View>
              </View>

              {/* ── Feedback banner ── */}
              {feedbackMessage ? (
                <View style={[styles.feedbackBanner, { backgroundColor: isCorrect ? '#1a3a1a' : '#3a1a1a', borderColor: isCorrect ? '#4CAF50' : '#f44336' }]}>
                  <MaterialCommunityIcons
                    name={isCorrect ? 'check-circle' : 'close-circle'}
                    size={20}
                    color={isCorrect ? '#4CAF50' : '#f44336'}
                  />
                  <Text style={[styles.feedbackText, { color: isCorrect ? '#4CAF50' : '#f44336' }]}>
                    {feedbackMessage}
                  </Text>
                </View>
              ) : null}

              {/* ── Input area ── */}
              <View style={styles.inputSection}>
                {/* <Text style={styles.inputLabel}></Text>*/}
                <View style={styles.inputRow}>
                  <View style={[styles.inputWrapper, { borderColor: tierColor }]}>
                    <MaterialCommunityIcons name="target" size={18} color={tierColor} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter aircraft name..."
                      placeholderTextColor="#444"
                      value={userGuess}
                      onChangeText={text => this.setState({ userGuess: text })}
                      onSubmitEditing={() => this.handleGuess(userGuess)}
                      returnKeyType="done"
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: tierColor }]}
                    onPress={() => this.handleGuess(userGuess)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="send" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

            </Animated.View>

          ) : (

            /* ── Waiting / empty state ── */
            <View style={styles.waitingContainer}>
              {feedbackMessage ? (
                <View style={[styles.feedbackBanner, styles.feedbackBannerWaiting, { backgroundColor: '#1a3a1a', borderColor: '#4CAF50' }]}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                  <Text style={[styles.feedbackText, { color: '#4CAF50' }]}>{feedbackMessage}</Text>
                </View>
              ) : null}

              {/* Animated radar ring */}
              <Animated.View style={[styles.radarOuter, { transform: [{ scale: this.pulseAnim }] }]}>
                <View style={styles.radarInner}>
                  <View style={styles.radarCore}>
                    <MaterialCommunityIcons name="radar" size={52} color="#ca8f0f" />
                  </View>
                </View>
              </Animated.View>

              <Text style={styles.waitTitle}>AWAITING TARGET</Text>
              <View style={styles.waitDivider} />
              <Text style={styles.waitSubtitle}>New aircraft will appear{'\n'}when the timer expires</Text>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {new Set(correctGuesses.map(g => g.DEXid)).size}
                  </Text>
                  <Text style={styles.statLabel}>IDENTIFIED</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {[...data1, ...data2, ...data3, ...data4, ...data5].length}
                  </Text>
                  <Text style={styles.statLabel}>TOTAL</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
}

export default function Home(props) {
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    const unsubscribeFocus = props.navigation?.addListener('focus', () => { ScreenCapture.preventScreenCaptureAsync(); });
    const unsubscribeBlur = props.navigation?.addListener('blur', () => { ScreenCapture.allowScreenCaptureAsync(); });
    return () => { unsubscribeFocus?.(); unsubscribeBlur?.(); ScreenCapture.allowScreenCaptureAsync(); };
  }, [props.navigation]);
  return <HomeClass {...props} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },

  // HUD bar
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
    backgroundColor: '#0d0d14',
  },
  hudLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hudRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hudLabel: { color: '#ca8f0f', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  hudScore: { color: '#4CAF50', fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 30 },

  // Game area
  gameContainer: { flex: 1 },

  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
    gap: 6,
    backgroundColor: '#0d0d14',
  },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  tierBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },

  // Image card
  imageCard: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#050508',
    marginBottom: 16,
    position: 'relative',
  },
  planeImage: { width: '100%' },
  corner: { position: 'absolute', width: 16, height: 16, borderWidth: 2, zIndex: 10 },
  cornerTL: { top: 6, left: 6, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 6, right: 6, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 46, left: 6, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 46, right: 6, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.35,
  },
  imageOverlay: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  imageOverlayText: {
    color: '#ffffff66',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 4,
  },
  imageOverlayLine: { height: 1, width: 40, opacity: 0.7 },

  // Feedback
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  feedbackBannerWaiting: { marginBottom: 30 },
  feedbackText: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },

  // Input
  inputSection: { marginTop: 4 },
  inputLabel: { color: '#333', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: '#0d0d14',
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 13,
    letterSpacing: 0.5,
  },
  submitBtn: {
    width: 50,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Waiting state
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  radarOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: '#ca8f0f22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  radarInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#ca8f0f44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#ca8f0f88',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ca8f0f11',
  },
  waitTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 5,
    marginBottom: 12,
  },
  waitDivider: {
    width: 40,
    height: 2,
    backgroundColor: '#ca8f0f',
    marginBottom: 14,
  },
  waitSubtitle: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 22,
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#1e1e2e',
    borderRadius: 4,
    overflow: 'hidden',
    width: '70%',
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: '#0d0d14' },
  statDivider: { width: 1, backgroundColor: '#1e1e2e' },
  statValue: { color: '#ca8f0f', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  statLabel: { color: '#444', fontSize: 9, letterSpacing: 2, marginTop: 2, fontWeight: '700' },
});