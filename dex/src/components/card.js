import React from 'react';
import { Text, View ,StyleSheet ,Image} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Helper function to get image from JSON path


const Card = ({
    name,
    description,
    attack,
    defense,
    image
}) => (
    <View style={styles.card}>
        <View>
                <Image source={{ uri: image }} style={styles.cardImage} />
        </View>
        <View>
            <Text style={styles.nameStyle}>{name}</Text>
        </View>
        <View>
            <Text style={styles.descriptionStyle}>{description}</Text>
        </View>
        <View style={styles.stats}>
                
                <Text style={styles.statsText}> <MaterialCommunityIcons name="sword-cross" size={16} color={"#000"} />{attack}</Text>
                <Text style={styles.statsText}> <MaterialCommunityIcons name="shield" size={16} color={"#000"} />{defense}</Text>

        </View>
    </View>
);

const styles = StyleSheet.create({
    card:{
        width:180,
        height:250,
        backgroundColor:"#ca8f0f",
        borderRadius:10,
        alignItems:"center",
        margin :7,
        marginTop:100,
    },
    cardImage:{
        width:150,
        height:90,
        borderRadius:10,
        marginTop:20,
    },
    nameStyle:{
        fontSize:16,
        fontWeight:"bold",
        marginTop:2, 
    },
    descriptionStyle:{
        fontSize:7,
        paddingLeft:10,
        paddingRight:10,
        height:60,

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
