import React, { Component } from 'react';
import { View, Text } from 'react-native';
import Card from '../components/card';

export default class test extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <View>
        <Card />
      </View>
    );
  }
}
