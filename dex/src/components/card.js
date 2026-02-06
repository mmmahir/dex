import React from 'react';
import { Text, View ,StyleSheet ,Image} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Card = ({
    params,
}) => (
    <View style={styles.card}>
        <View>
            <Image source={require("../../assets/F-15.jpg")} style={styles.cardImage} />
        </View>
        <View>
            <Text style={styles.nameStyle}>F-15</Text>
        </View>
        <View>
            <Text style={styles.descriptionStyle}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent condimentum mauris sed augue iaculis, et malesuada velit congue. Maecenas blandit suscipit laoreet.  </Text>
        </View>
        <View style={styles.stats}>
                
                <Text style={styles.statsText}> <MaterialCommunityIcons name="sword-cross" size={16} color={"#000"} /> 100</Text>
                <Text style={styles.statsText}> <MaterialCommunityIcons name="shield" size={16} color={"#000"} /> 100</Text>

        </View>
    </View>
);

const styles = StyleSheet.create({
    card:{
        width:200,
        height:300,
        backgroundColor:"#ca8f0f",
        borderRadius:10,

        alignItems:"center",
        margin :20,
        marginTop:100,
    },
    cardImage:{
        width:170,
        height:120,
        borderRadius:10,
        marginTop:20,
    },
    nameStyle:{
        fontSize:20,
        fontWeight:"bold",
        marginTop:2, 
    },
    descriptionStyle:{
        fontSize:8,
        paddingLeft:10,
        paddingRight:10,

    },
    stats:{
        flex:1,
        flexDirection:"row",
        justifyContent:"space-between",
    },
    statsText:{
        fontSize:16,
        fontWeight:"bold",
        margin:10,

    }
});

export default Card;
