import React, { Component } from 'react';
import { View, Text ,StyleSheet} from 'react-native';
import Card from '../components/card';



export default class test extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }




  render() {
    return (
    <View style={styles.container}>
        <Card 
            name="F-15 Eagle"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed mattis tincidunt lectus, ultrices aliquam dui pellentesque a. Praesent in suscipit nibh, ut pellentesque ipsum."
            attack={85}
            defense={70}
            image={require("../../assets/F-15.jpg")}
        />
        <Card 
            name="F-15 Eagle"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed mattis tincidunt lectus, ultrices aliquam dui pellentesque a. Praesent in suscipit nibh, ut pellentesque ipsum."
            attack={85}
            defense={70}
            image={require("../../assets/F-15.jpg")}
        /> 
    </View>
    );
  }
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        flexDirection:"row",
    }
});