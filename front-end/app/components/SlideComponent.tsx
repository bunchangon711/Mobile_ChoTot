import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import Swiper from "react-native-swiper";

const SlideComponent = () => {
  const [imageHeight, setImageHeight] = useState(300); // Default height
  const screenWidth = Dimensions.get("window").width;

  const slides = [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/dc6gusuog/image/upload/v1727686810/ct3_envlmk.png",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/dc6gusuog/image/upload/v1727686810/ct4_xqzpi4.jpg",
    },
    {
      id: 3,
      image:
        "https://res.cloudinary.com/dc6gusuog/image/upload/v1727686810/ct2_yg2svf.jpg",
    },
    {
      id: 4,
      image:
        "https://res.cloudinary.com/dc6gusuog/image/upload/v1727686810/ct1_uw6g0f.jpg",
    },
  ];

  useEffect(() => {
    Image.getSize(slides[0].image, (width, height) => {
      const aspectRatio = height / width;
      const calculatedHeight = screenWidth * aspectRatio;
      setImageHeight(calculatedHeight); // Adjust the height based on screen width
    });
  }, [screenWidth]);

  return (
    <View style={{ height: imageHeight }}>
      <Swiper showsButtons={false} autoplay={true}>
        {slides.map((slide) => (
          <View style={[styles.slide, { height: imageHeight }]} key={slide.id}>
            <Image
              source={{ uri: slide.image }}
              style={[styles.image, { height: imageHeight }]}
            />
          </View>
        ))}
      </Swiper>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%", // Ensure the slide takes up the full width
  },
  image: {
    width: "100%", // Full width
    resizeMode: "cover", // Ensure the image covers the entire area
  },
});

export default SlideComponent;
