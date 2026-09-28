import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const steps = ['सेवा', 'पत्ता', 'वेळ', 'प्रमाण', 'सारांश'] as const;

export function BookingFlow() {
  const [step, setStep] = useState(0);
  return (
    <View style={styles.page}>
      <Text style={styles.kicker}>BOOKING · {step + 1} OF 5</Text>
      <Text style={styles.title}>{steps[step]}</Text>
      <View style={styles.progress}>{steps.map((name, index) => <View key={name} style={[styles.dot, index <= step && styles.active]}><Text style={index <= step ? styles.activeText : styles.dotText}>{index + 1}</Text></View>)}</View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧹 रूम साफसफाई</Text>
        <Text style={styles.meta}>Live services and prices load from the backend.</Text>
        {step === 1 && <Text style={styles.available}>✓ सेवा या भागात उपलब्ध आहे</Text>}
        {step === 4 && <Text style={styles.price}>अंतिम किंमत: Backend price</Text>}
      </View>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => setStep(Math.min(4, step + 1))}><Text style={styles.buttonText}>{step === 4 ? 'बुकिंग निश्चित करा' : 'पुढे जा'}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({page:{flex:1,padding:20,backgroundColor:'#F8FAF9'},kicker:{marginTop:24,color:'#176B5B',fontWeight:'800',fontSize:11,letterSpacing:1.4},title:{fontSize:28,fontWeight:'900',marginTop:8},progress:{flexDirection:'row',justifyContent:'space-between',marginVertical:24},dot:{width:32,height:32,borderRadius:16,backgroundColor:'#E1E8E5',alignItems:'center',justifyContent:'center'},active:{backgroundColor:'#176B5B'},dotText:{color:'#63716D'},activeText:{color:'#FFF',fontWeight:'800'},card:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#DCE5E1',borderRadius:16,padding:18,minHeight:180},cardTitle:{fontSize:18,fontWeight:'800'},meta:{color:'#63716D',marginTop:10,lineHeight:21},available:{marginTop:20,padding:12,borderRadius:10,backgroundColor:'#E6F4EF',color:'#176B5B',fontWeight:'700'},price:{marginTop:26,fontWeight:'900',color:'#176B5B'},button:{height:54,borderRadius:14,backgroundColor:'#176B5B',alignItems:'center',justifyContent:'center',marginTop:20},buttonText:{color:'#FFF',fontWeight:'900',fontSize:16}});
