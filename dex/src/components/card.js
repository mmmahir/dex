import React, { useState } from 'react';
import {
  Text, View, StyleSheet, Image, Dimensions,
  TouchableOpacity, Modal, Alert, Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth / 2 - 24;
const CARD_HEIGHT = CARD_WIDTH * 1.45;
const IMAGE_HEIGHT = CARD_HEIGHT * 0.38;

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

const Card = ({ name, description, attack, defense, image, DEXid, tier, onDelete }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const resolvedTier = getTierFromDEXid(DEXid, tier);
  const colors = TIER_COLORS[resolvedTier] || TIER_COLORS[5];

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
        <View style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.border, width: CARD_WIDTH, height: CARD_HEIGHT }]}>
          <View style={[styles.tierBadge, { backgroundColor: colors.border }]}>
            <Text style={styles.tierBadgeText}>{colors.label}</Text>
          </View>
          <Image source={{ uri: image }} style={[styles.cardImage, { height: IMAGE_HEIGHT }]} resizeMode="cover" />
          <Text style={styles.nameStyle} numberOfLines={2}>{name}</Text>
          <Text style={styles.descriptionStyle} numberOfLines={3}>{description}</Text>
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              <MaterialCommunityIcons name="sword-cross" size={14} color="#fff" /> {attack}
            </Text>
            <Text style={styles.statsText}>
              <MaterialCommunityIcons name="shield" size={14} color="#fff" /> {defense}
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
        {/* Backdrop — tap outside to close */}
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
          {/* Stop tap-through on the card itself */}
          <Pressable onPress={e => e.stopPropagation()} style={styles.modalWrapper}>

            {/* Big card */}
            <View style={[styles.modalCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <View style={[styles.modalTierBadge, { backgroundColor: colors.border }]}>
                <Text style={styles.modalTierBadgeText}>{colors.label}</Text>
              </View>

              <Image
                source={{ uri: image }}
                style={styles.modalImage}
                resizeMode="cover"
              />

              <Text style={styles.modalName}>{name}</Text>

              {DEXid ? <Text style={styles.modalDexId}>{DEXid}</Text> : null}

              <View style={styles.modalDescBox}>
                <Text style={styles.modalDescription}>{description}</Text>
              </View>

              <View style={styles.modalStats}>
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="sword-cross" size={26} color="#fff" />
                  <Text style={styles.modalStatValue}>{attack}</Text>
                  <Text style={styles.modalStatLabel}>ATTACK</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="shield" size={26} color="#fff" />
                  <Text style={styles.modalStatValue}>{defense}</Text>
                  <Text style={styles.modalStatLabel}>DEFENSE</Text>
                </View>
              </View>
            </View>

            {/* Action buttons */}
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
  // Small card
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
    fontSize: Math.max(11, screenWidth * 0.030),
    fontWeight: 'bold',
    marginTop: 6,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  descriptionStyle: {
    fontSize: Math.max(8, screenWidth * 0.022),
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
    fontSize: Math.max(11, screenWidth * 0.030),
    fontWeight: 'bold',
    color: '#fff',
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrapper: {
    width: screenWidth * 0.84,
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
    height: screenHeight * 0.24,
    borderRadius: 14,
    marginTop: 14,
    backgroundColor: '#00000033',
  },
  modalName: {
    fontSize: Math.max(20, screenWidth * 0.058),
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
    fontSize: Math.max(12, screenWidth * 0.033),
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
    fontSize: Math.max(20, screenWidth * 0.055),
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