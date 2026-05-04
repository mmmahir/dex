import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking,
  ScrollView, Dimensions, Animated, Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CONSENT_KEY = 'jet_dex_consent_accepted';
const PRIVACY_URL = 'https://doc-hosting.flycricket.io/jet-dex-privacy-policy/ba7c77c3-de2b-4e4e-b4ab-83eb09961981/privacy';
const TERMS_URL   = 'https://doc-hosting.flycricket.io/jet-dex-terms-of-use/48b72e30-be81-48ce-9bd6-389722745423/terms';

export default function ConsentGate({ children }) {
  const [status, setStatus]          = useState('loading'); // 'loading' | 'pending' | 'accepted'
  const [privacyChecked, setPrivacy] = useState(false);
  const [termsChecked, setTerms]     = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scanAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY)
      .then(val => {
        if (val === 'true') {
          setStatus('accepted');
        } else {
          setStatus('pending');
        }
      })
      .catch(() => {
        setStatus('pending');
      });
  }, []);

  useEffect(() => {
    if (status !== 'pending') return;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();
  }, [status]);

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(CONSENT_KEY, 'true');
    } catch (_) {}
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 250, useNativeDriver: true,
    }).start(() => setStatus('accepted'));
  };

  const openLink = (url) => Linking.openURL(url).catch(() => {});

  // Still checking storage — render dark background (no white flash)
  if (status === 'loading') {
    return <View style={styles.loadingRoot} />;
  }

  // Already accepted — render the app
  if (status === 'accepted') {
    return children;
  }

  const canAccept = privacyChecked && termsChecked;
  const { height: H } = Dimensions.get('window');

  const scanTranslate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-H * 0.6, H * 0.6],
  });

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>

      {/* Atmospheric scan line */}
      <Animated.View
        pointerEvents="none"
        style={[styles.scanLine, { transform: [{ translateY: scanTranslate }] }]}
      />

      {/* Corner brackets */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="shield-lock-outline" size={28} color="#ca8f0f" />
          </View>
          <Text style={styles.title}>AUTHORIZATION{'\n'}REQUIRED</Text>
          <View style={styles.titleBar} />
          <Text style={styles.subtitle}>
            Review and accept our agreements before accessing JET DEX.
          </Text>
        </View>

        {/* Scrollable agreements */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.docRow}
            onPress={() => setPrivacy(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, privacyChecked && styles.checkboxOn]}>
              {privacyChecked && (
                <MaterialCommunityIcons name="check" size={13} color="#0a0a0f" />
              )}
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>PRIVACY POLICY</Text>
              <Text style={styles.docSub}>How we handle your data</Text>
            </View>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => openLink(PRIVACY_URL)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="open-in-new" size={13} color="#ca8f0f" />
              <Text style={styles.viewBtnText}>VIEW</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <View style={styles.sep} />

          {/* Terms of Use */}
          <TouchableOpacity
            style={styles.docRow}
            onPress={() => setTerms(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, termsChecked && styles.checkboxOn]}>
              {termsChecked && (
                <MaterialCommunityIcons name="check" size={13} color="#0a0a0f" />
              )}
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>TERMS OF USE</Text>
              <Text style={styles.docSub}>Rules governing app usage</Text>
            </View>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => openLink(TERMS_URL)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="open-in-new" size={13} color="#ca8f0f" />
              <Text style={styles.viewBtnText}>VIEW</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <View style={styles.sep} />

          <Text style={styles.helper}>
            Tap a row to confirm you agree. Tap VIEW to read the document.
          </Text>
        </ScrollView>

        {/* Footer CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.acceptBtn, !canAccept && styles.acceptBtnOff]}
            onPress={canAccept ? handleAccept : undefined}
            activeOpacity={canAccept ? 0.75 : 1}
          >
            <MaterialCommunityIcons
              name={canAccept ? 'check-circle-outline' : 'lock-outline'}
              size={16}
              color={canAccept ? '#0a0a0f' : '#333'}
            />
            <Text style={[styles.acceptTxt, !canAccept && styles.acceptTxtOff]}>
              {canAccept ? 'AUTHORIZE & CONTINUE' : 'ACCEPT BOTH TO CONTINUE'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footNote}>
            This screen will not appear again after accepting.
          </Text>
        </View>

      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scanLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 2,
    backgroundColor: '#ca8f0f',
    opacity: 0.07,
  },

  corner: {
    position: 'absolute',
    width: 16, height: 16,
    borderColor: '#ca8f0f33',
    borderWidth: 2,
  },
  cornerTL: { top: 54, left: 18, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 54, right: 18, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 32, left: 18, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 32, right: 18, borderLeftWidth: 0, borderTopWidth: 0 },

  card: {
    width: '88%',
    maxWidth: 420,
    backgroundColor: '#0d0d14',
    borderWidth: 1,
    borderColor: '#1e1e2e',
    borderRadius: 4,
    overflow: 'hidden',
  },

  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 22,
    backgroundColor: '#0a0a0f',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  iconBox: {
    width: 52, height: 52,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ca8f0f33',
    backgroundColor: '#ca8f0f0d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    lineHeight: 28,
  },
  titleBar: {
    width: 36, height: 2,
    backgroundColor: '#ca8f0f',
    marginTop: 10, marginBottom: 10,
  },
  subtitle: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.3,
  },

  scroll: { flexGrow: 0 },
  scrollContent: { padding: 18 },

  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  checkbox: {
    width: 22, height: 22,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#3a3a4a',
    backgroundColor: '#16161f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: '#ca8f0f',
    borderColor: '#ca8f0f',
  },
  docInfo: { flex: 1 },
  docLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 2,
  },
  docSub: {
    color: '#444',
    fontSize: 11,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#ca8f0f33',
    borderRadius: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: '#ca8f0f0d',
  },
  viewBtnText: {
    color: '#ca8f0f',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  sep: { height: 1, backgroundColor: '#1e1e2e' },

  helper: {
    color: '#2d2d3a',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 14,
  },

  footer: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#1e1e2e',
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    gap: 10,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ca8f0f',
    borderRadius: 4,
    paddingVertical: 14,
    width: '100%',
  },
  acceptBtnOff: {
    backgroundColor: '#16161f',
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  acceptTxt: {
    color: '#0a0a0f',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  acceptTxtOff: { color: '#333' },

  footNote: {
    color: '#2a2a3a',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});