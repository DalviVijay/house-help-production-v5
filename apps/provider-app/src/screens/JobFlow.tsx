import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const states = ['PROVIDER_ASSIGNED', 'PROVIDER_ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'] as const;
const actions = ['निघालो', 'पोहोचलो', 'काम सुरू', 'काम पूर्ण', 'पूर्ण'] as const;

export function JobFlow() {
  const [index, setIndex] = useState(0);
  return <View style={styles.page}><Text style={styles.brand}>HOUSE HELP · VERIFIED PARTNER</Text><Text style={styles.title}>आजचे काम</Text><View style={styles.card}><Text style={styles.status}>{states[index]}</Text><Text style={styles.job}>🧹 रूम साफसफाई</Text><Text style={styles.meta}>2 Rooms · Kopar Khairane</Text><Pressable disabled={index === 4} style={[styles.button,index === 4 && styles.done]} onPress={() => setIndex(Math.min(4,index + 1))}><Text style={styles.buttonText}>{actions[index]}</Text></Pressable><Text style={styles.note}>The API validates identity, verification and every status transition.</Text></View></View>;
}
const styles=StyleSheet.create({page:{flex:1,padding:20,backgroundColor:'#F8FAF9'},brand:{marginTop:22,color:'#176B5B',fontWeight:'900',fontSize:12},title:{fontSize:28,fontWeight:'900',marginVertical:24},card:{padding:20,borderWidth:1,borderColor:'#DCE5E1',borderRadius:16,backgroundColor:'#FFF'},status:{fontSize:11,color:'#176B5B',fontWeight:'900'},job:{fontSize:20,fontWeight:'900',marginTop:24},meta:{color:'#63716D',marginTop:8},button:{height:54,borderRadius:14,backgroundColor:'#F5A623',alignItems:'center',justifyContent:'center',marginTop:26},done:{backgroundColor:'#176B5B'},buttonText:{fontWeight:'900'},note:{color:'#63716D',fontSize:12,textAlign:'center',marginTop:14,lineHeight:18}});
