import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

const newsData = [
  {
    id: '1',
    title: 'Đặt xe online',
    image: { uri: 'https://res.cloudinary.com/dc6gusuog/image/upload/v1727686810/ct1_uw6g0f.jpg' },
  },
  {
    id: '2',
    title: 'Tưng bừng khai trương',
    image: { uri: 'https://res.cloudinary.com/dc6gusuog/image/upload/v1727854953/ct5_bupym1.jpg' },
  },
  {
    id: '3',
    title: 'Hình sạc phòng vay',
    image: { uri: 'https://res.cloudinary.com/dc6gusuog/image/upload/v1727686810/ct4_xqzpi4.jpg' },
  },
  {
    id: '4',
    title: 'Cơ hội 10 triệu',
    image: { uri: 'https://res.cloudinary.com/dc6gusuog/image/upload/v1727686810/ct2_yg2svf.jpg' },
  },
  {
    id: '5',
    title: 'Tính năng thanh toán',
    image: { uri: 'https://res.cloudinary.com/dc6gusuog/image/upload/v1727686810/ct3_envlmk.png' },
  },
];

const News = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chợ Tốt Có Gì Mới?</Text>
      <View style={styles.list}>
        {newsData.map(item => (
          <TouchableOpacity key={item.id} style={styles.itemContainer}>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow items to wrap into multiple rows
    justifyContent: 'space-between', // Space out items evenly
  },
  itemContainer: {
    width: '48%', // Set width to allow two items per row
    marginBottom: 16,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    height: 180,
    shadowColor: '#000', // Add shadow for depth
    shadowOffset: { width: 0, height: 2 }, // Shadow offset
    shadowOpacity: 0.1, // Shadow opacity
    shadowRadius: 4, // Shadow radius
    elevation: 3, // For Android shadow
  },
  image: {
    width: '100%',
    height: '70%', // Adjust height for better aspect ratio
    resizeMode: 'cover', // Maintain aspect ratio
  },
  title: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default News;
