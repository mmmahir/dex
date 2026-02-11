import React, { Component } from 'react';
import { View, Text ,StyleSheet ,FlatList,Dimensions, TouchableOpacity,ScrollView} from 'react-native';
import Card from '../components/card';
import data1 from '../data/t1.json';
import data5 from '../data/t5.json';

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (screenWidth / numColumns) - 30; 

export default class test extends Component {
  constructor(props) {
    super(props);
    this.state = {
      planes: data1,
      planes5: data5,
      // sources is an array of data sources with weights; add more entries to support more datasets
      sources: [
        { items: data1, weight: 0.3, keyPrefix: 'd1' },
        { items: data5, weight: 0.7, keyPrefix: 'd5' },
      ],
      mixedPlanes: [],
      selectedItem: null,
    };
  }

  componentDidMount() {
    this.generateSingle();
  }

  // Generate a mixed array from configured `sources` using their weights.
  generateMixed = (size) => {
    const sources = this.state.sources || [];
    if (!sources.length) return this.setState({ mixedPlanes: [] });

    // normalize weights
    const totalWeight = sources.reduce((s, src) => s + (src.weight || 0), 0) || 1;
    const cumulative = [];
    let c = 0;
    for (const src of sources) {
      c += (src.weight || 0) / totalWeight;
      cumulative.push(c);
    }

    const itemsCount = size || Math.max(1, sources.reduce((s, src) => s + (src.items ? src.items.length : 0), 0));
    const mixed = [];
    for (let i = 0; i < itemsCount; i++) {
      const r = Math.random();
      // pick source by cumulative weights
      let idx = 0;
      while (idx < cumulative.length && r > cumulative[idx]) idx++;
      const chosen = sources[Math.min(idx, sources.length - 1)];
      const pool = chosen.items || [];
      if (!pool.length) continue;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      mixed.push(Object.assign({}, pick, { _mixedKey: `${chosen.keyPrefix || 's'}-${i}-${pick.id}` }));
    }

    this.setState({ mixedPlanes: mixed });
  };

  // pick a single item using the configured source weights
  generateSingle = () => {
    const sources = this.state.sources || [];
    if (!sources.length) return this.setState({ selectedItem: null });

    const totalWeight = sources.reduce((s, src) => s + (src.weight || 0), 0) || 1;
    const cumulative = [];
    let c = 0;
    for (const src of sources) {
      c += (src.weight || 0) / totalWeight;
      cumulative.push(c);
    }

    const r = Math.random();
    let idx = 0;
    while (idx < cumulative.length && r > cumulative[idx]) idx++;
    const chosen = sources[Math.min(idx, sources.length - 1)];
    const pool = chosen.items || [];
    if (!pool.length) return this.setState({ selectedItem: null });
    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.setState({ selectedItem: Object.assign({}, pick, { _mixedKey: `${chosen.keyPrefix || 's'}-single-${pick.id}` }) });
  };

  renderLightItem = ({ item }) => (
    <View >
      <Card name={item.name} description={item.description} attack={item.attack} defense={item.defense} image={item.image} />
    </View>
  );





  render() {
    return (
    <ScrollView style={styles.container}>


        {this.state.selectedItem ? (
          <View>
            <Card
              name={this.state.selectedItem.name}
              description={this.state.selectedItem.description}
              attack={this.state.selectedItem.attack}
              defense={this.state.selectedItem.defense}
              image={this.state.selectedItem.image}
            />
          </View>
        ) : (
          <Text style={{ textAlign: 'center', margin: 12 }}>No item</Text>
        )}
        <TouchableOpacity style={styles.button} onPress={() => this.generateSingle()}>
          <Text style={styles.buttonText}>Randomize</Text>
        </TouchableOpacity>
    </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        flexDirection:"column",
    },
    button: {
        backgroundColor: '#ca8f0f',
        padding: 15,
        margin: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});