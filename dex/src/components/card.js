import React, { useState } from 'react';
import {
  Text, View, StyleSheet, Image, Dimensions,
  TouchableOpacity, Modal, Alert, Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TIER_COLORS = {
  1: { bg: '#ca8f0f', border: '#a0700a', label: 'LEGENDARY' },
  2: { bg: '#9b59b6', border: '#7d3c98', label: 'EPIC' },
  3: { bg: '#2980b9', border: '#1a5276', label: 'RARE' },
  4: { bg: '#27ae60', border: '#1e8449', label: 'UNCOMMON' },
  5: { bg: '#7f8c8d', border: '#616a6b', label: 'COMMON' },
};

const getTierFromDEXid = (DEXid, tier) => {
  if (tier) return tier;
  if (!DEXid) return 5;
  const prefix = parseInt(DEXid.replace('#', '')[0]);
  return prefix || 5;
};

// All sizing calculated fresh per render from current window dimensions
const getCardMetrics = () => {
  const { width, height } = Dimensions.get('window');
  const cardWidth = width / 2 - 24;
  const cardHeight = cardWidth * 1.45;
  return {
    w: width,
    h: height,
    cardWidth,
    cardHeight,
    imageHeight: cardHeight * 0.38,
    nameFontSize: Math.max(11, width * 0.030),
    descFontSize: Math.max(8, width * 0.022),
    statFontSize: Math.max(11, width * 0.030),
    modalWidth: width * 0.84,
    modalImageHeight: height * 0.24,
    modalNameSize: Math.max(20, width * 0.058),
    modalDescSize: Math.max(12, width * 0.033),
    modalStatSize: Math.max(20, width * 0.055),
  };
};

const Card = ({ name, description, attack, defense, image, DEXid, tier, onDelete }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const resolvedTier = getTierFromDEXid(DEXid, tier);
  const colors = TIER_COLORS[resolvedTier] || TIER_COLORS[5];
  const m = getCardMetrics();

  const handleDelete = () => {
    Alert.alert(
      'Remove Card',
      `Remove ${name} from your DEX?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setModalVisible(false);
            if (onDelete) onDelete(DEXid);
          },
        },
      ]
    );
  };

  return (
    <>
      {/* Normal card — long-press opens fullscreen */}
      <Pressable onLongPress={() => setModalVisible(true)} delayLongPress={300}>
        <View style={[styles.card, {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          width: m.cardWidth,
          height: m.cardHeight,
        }]}>
          <View style={[styles.tierBadge, { backgroundColor: colors.border }]}>
            <Text style={styles.tierBadgeText}>{colors.label}</Text>
          </View>
          <Image
            source={{ uri: image }}
            style={[styles.cardImage, { height: m.imageHeight }]}
            resizeMode="cover"
          />
          <Text style={[styles.nameStyle, { fontSize: m.nameFontSize }]} numberOfLines={2}>
            {name}
          </Text>
          <Text style={[styles.descriptionStyle, { fontSize: m.descFontSize }]} numberOfLines={3}>
            {description}
          </Text>
          <View style={styles.stats}>
            <Text style={[styles.statsText, { fontSize: m.statFontSize }]}>
              <MaterialCommunityIcons name="sword-cross" size={m.statFontSize} color="#fff" /> {attack}
            </Text>
            <Text style={[styles.statsText, { fontSize: m.statFontSize }]}>
              <MaterialCommunityIcons name="shield" size={m.statFontSize} color="#fff" /> {defense}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Fullscreen modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
          <Pressable onPress={e => e.stopPropagation()} style={[styles.modalWrapper, { width: m.modalWidth }]}>

            <View style={[styles.modalCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <View style={[styles.modalTierBadge, { backgroundColor: colors.border }]}>
                <Text style={styles.modalTierBadgeText}>{colors.label}</Text>
              </View>

              <Image
                source={{ uri: image }}
                style={[styles.modalImage, { height: m.modalImageHeight }]}
                resizeMode="cover"
              />

              <Text style={[styles.modalName, { fontSize: m.modalNameSize }]}>{name}</Text>

              {DEXid ? <Text style={styles.modalDexId}>{DEXid}</Text> : null}

              <View style={styles.modalDescBox}>
                <Text style={[styles.modalDescription, { fontSize: m.modalDescSize }]}>{description}</Text>
              </View>

              <View style={styles.modalStats}>
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="sword-cross" size={26} color="#fff" />
                  <Text style={[styles.modalStatValue, { fontSize: m.modalStatSize }]}>{attack}</Text>
                  <Text style={styles.modalStatLabel}>ATTACK</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="shield" size={26} color="#fff" />
                  <Text style={[styles.modalStatValue, { fontSize: m.modalStatSize }]}>{defense}</Text>
                  <Text style={styles.modalStatLabel}>DEFENSE</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color="#fff" />
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#fff" />
                <Text style={styles.deleteBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Small card — width/height/fontSize applied inline from getCardMetrics()
  card: {
    borderRadius: 12,
    alignItems: 'center',
    margin: 8,
    borderWidth: 2,
    overflow: 'hidden',
    paddingBottom: 6,
  },
  tierBadge: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 3,
  },
  tierBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  cardImage: {
    width: '90%',
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#00000033',
  },
  nameStyle: {
    fontWeight: 'bold',
    marginTop: 6,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  descriptionStyle: {
    paddingHorizontal: 8,
    color: '#ffffffcc',
    textAlign: 'center',
    marginTop: 4,
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  statsText: {
    fontWeight: 'bold',
    color: '#fff',
  },

  // Modal — width/imageHeight applied inline
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrapper: {
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 18,
  },
  modalTierBadge: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalTierBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  modalImage: {
    width: '92%',
    borderRadius: 14,
    marginTop: 14,
    backgroundColor: '#00000033',
  },
  modalName: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
  },
  modalDexId: {
    fontSize: 12,
    color: '#ffffff88',
    marginTop: 3,
    letterSpacing: 1,
  },
  modalDescBox: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 10,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '88%',
  },
  modalDescription: {
    color: '#ffffffdd',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '88%',
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 2,
    height: 50,
    opacity: 0.5,
  },
  modalStatValue: {
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  modalStatLabel: {
    fontSize: 10,
    color: '#ffffffaa',
    letterSpacing: 1,
    marginTop: 2,
  },

  // Buttons
  modalActions: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 12,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 30,
    gap: 6,
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c0392b',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 30,
    gap: 6,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default Card;