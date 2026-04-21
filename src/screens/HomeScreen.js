import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { specialsAPI } from '../api';
import { formatCurrency } from '../theme';

const SV = {
  green: '#228B22',
  greenLight: '#ADFF2F',
  brown: '#8B4513',
  sandybrown: '#F4A460',
  bg: '#228B22',
};

export default function HomeScreen({ navigation }) {
  const { logout, token } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSpecials = useCallback(() => {
    if (!token) return Promise.resolve();
    return specialsAPI.get(token)
      .then(data => setFeatured([
        ...(data.popular ?? []),
        ...(data.overstocked ?? []),
        ...(data.random ? [data.random] : []),
      ]))
      .catch(() => {});
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoadingFeatured(true);
      fetchSpecials().finally(() => setLoadingFeatured(false));
      const interval = setInterval(fetchSpecials, 30000);
      return () => clearInterval(interval);
    }, [fetchSpecials])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchSpecials().finally(() => setRefreshing(false)); }}
            tintColor={SV.greenLight}
          />
        }
      >

        <View style={styles.logoDiv}>
          <Text style={styles.logoText}>🥦 SpeedyVeg</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color={SV.brown} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Shop')}>
          <Ionicons name="cart-outline" size={20} color={SV.greenLight} />
          <Text style={styles.shopBtnText}>Go to Shop</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.heroDiv}>
          <Image source={require('../../assets/F1veg.jpg')} style={styles.f1Img} resizeMode="cover" />
          <View style={styles.heroList}>
            <Text style={styles.heroItem}>Fast Veg !</Text>
            <Text style={styles.heroItem}>Straight To Your Doorstep !!</Text>
            <Text style={styles.heroItem}>Within Minutes !!!</Text>
          </View>
        </View>

        {/* About Us */}
        <View style={styles.wwdDiv}>
          <Text style={styles.wwdTitle}>About Us</Text>
          <View style={styles.wwdRow}>
            <View style={styles.wwdTextBlock}>
              <Text style={styles.wwdText}>
                Here at SPEEDYVEG our aim is to get the freshest vegetables to your door minutes after you click "order".
              </Text>
              <Text style={styles.wwdText}>
                Our high speed order system makes sure there is no time wasted in getting your 5 a day.
              </Text>
              <Text style={styles.wwdText}>
                Nobody can compete with our quality or our speed — if you can, you'll get your money back, guaranteed.
              </Text>
            </View>
            <Image source={require('../../assets/SpeedyFramers.jpg')} style={styles.farmImg} resizeMode="cover" />
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.sectionTitleDiv}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
        </View>

        {loadingFeatured ? (
          <ActivityIndicator color={SV.greenLight} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.featuredRow}>
            {featured.length === 0 ? (
              <Text style={styles.featuredEmpty}>No featured products available.</Text>
            ) : (
              featured.map(product => (
                <View key={product._id} style={styles.featuredCard}>
                  {product.image
                    ? <Image source={{ uri: product.image }} style={styles.productImg} resizeMode="cover" />
                    : <View style={[styles.productImg, styles.productImgPlaceholder]}>
                        <Ionicons name="leaf" size={32} color={SV.brown} />
                      </View>
                  }
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.featuredPrice}>{formatCurrency(product.price)} / {product.unit}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Awards */}
        <View style={styles.sectionTitleDiv}>
          <Text style={styles.sectionTitle}>Awards</Text>
        </View>
        <View style={styles.awardsRow}>
          <Image source={require('../../assets/award1.png')} style={styles.awardImg} resizeMode="contain" />
          <Image source={require('../../assets/bordbia.png')} style={styles.awardImg} resizeMode="contain" />
          <Image source={require('../../assets/greenaward.png')} style={styles.awardImg} resizeMode="contain" />
        </View>

        {/* Contact footer */}
        <View style={styles.footerDiv}>
          <Text style={styles.footerTitle}>Contact Us</Text>
          <Text style={styles.footerText}>123 Veg Lane,</Text>
          <Text style={styles.footerText}>Co. Galway, Dublin Rd,</Text>
          <Text style={styles.footerText}>Ireland</Text>
          <Text style={styles.footerText}>Call: +353 1 800 2121</Text>
          <Text style={styles.footerText}>Email: Speedyveg@veg.ie</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SV.bg },
  container: { flex: 1 },

  logoDiv: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: SV.greenLight, borderRadius: 25, margin: 8, paddingHorizontal: 20, paddingVertical: 18,
  },
  logoText: { fontSize: 28, fontWeight: '800', color: SV.brown, flex: 1, textAlign: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  logoutText: { color: SV.brown, fontWeight: '700', fontSize: 13 },

  shopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: SV.brown, borderRadius: 12,
    marginHorizontal: 8, marginBottom: 8, paddingVertical: 14,
  },
  shopBtnText: { color: SV.greenLight, fontWeight: '700', fontSize: 15 },

  heroDiv: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SV.greenLight, borderRadius: 25, margin: 8, padding: 16, gap: 16,
  },
  f1Img: { width: 80, height: 80, borderRadius: 10 },
  heroList: { flex: 1 },
  heroItem: { color: SV.brown, fontStyle: 'italic', fontWeight: '700', fontSize: 16, marginBottom: 10 },

  wwdDiv: { backgroundColor: SV.greenLight, borderRadius: 25, margin: 8, padding: 16 },
  wwdTitle: { color: SV.brown, fontSize: 26, fontWeight: '700', marginBottom: 10 },
  wwdRow: { flexDirection: 'row', gap: 10 },
  wwdTextBlock: { flex: 1 },
  wwdText: { color: SV.brown, fontSize: 13, lineHeight: 20, marginBottom: 8 },
  farmImg: { width: 120, height: 120, borderRadius: 60 },

  sectionTitleDiv: {
    backgroundColor: SV.greenLight, borderRadius: 12, alignSelf: 'center',
    paddingHorizontal: 28, paddingVertical: 6, marginTop: 16, marginBottom: 8,
  },
  sectionTitle: { color: SV.brown, fontSize: 20, fontWeight: '700', textAlign: 'center' },

  featuredRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 8, marginBottom: 8, justifyContent: 'center' },
  featuredCard: {
    width: '30%', backgroundColor: SV.sandybrown, borderRadius: 12,
    alignItems: 'center', padding: 12, borderWidth: 2, borderColor: SV.brown,
  },
  productImg: { width: 80, height: 80, borderRadius: 10, marginBottom: 8 },
  productImgPlaceholder: { backgroundColor: SV.greenLight, justifyContent: 'center', alignItems: 'center' },
  productName: { color: SV.brown, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  featuredPrice: { color: SV.brown, fontSize: 12, marginTop: 2 },
  featuredEmpty: { color: SV.greenLight, fontSize: 13, textAlign: 'center', flex: 1, marginVertical: 20 },

  awardsRow: { flexDirection: 'row', justifyContent: 'space-around', margin: 8, marginBottom: 16 },
  awardImg: { width: 90, height: 90, borderRadius: 12 },

  footerDiv: { backgroundColor: SV.greenLight, borderRadius: 25, margin: 8, marginBottom: 24, padding: 20 },
  footerTitle: { color: SV.brown, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  footerText: { color: SV.brown, fontSize: 14, lineHeight: 26 },
});
