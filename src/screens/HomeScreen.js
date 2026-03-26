import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency, formatDate } from '../theme';

const SV = {
  green: '#228B22',
  greenLight: '#ADFF2F',
  brown: '#8B4513',
  sandybrown: '#F4A460',
  bg: '#228B22',
};

const PRODUCTS = [
  { id: 'broccoli', name: 'Broccoli', price: 1.50, image: require('../../assets/broccoli.jpg') },
  { id: 'carrots',  name: 'Carrots',  price: 0.99, image: require('../../assets/carrots.png') },
  { id: 'tomato',   name: 'Tomato',   price: 1.20, image: require('../../assets/tomato.png') },
  { id: 'peas',     name: 'Peas',     price: 1.10, image: require('../../assets/greenpeas.webp') },
];

export default function HomeScreen({ navigation }) {
  const { getTransactions } = useTransactions();
  const recentOrders = getTransactions().filter(t => t.categoryId === '5').slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Logo header */}
        <View style={styles.logoDiv}>
          <Image source={require('../../assets/speedyveg-logo.png')} style={styles.logo} resizeMode="contain" />
          <Image source={require('../../assets/veglogo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Nav */}
        <View style={styles.nav}>
          {['What We Do', 'Products', 'Awards', 'Contact'].map(label => (
            <Text key={label} style={styles.navText}>{label}</Text>
          ))}
          <TouchableOpacity onPress={() => navigation.navigate('Shop')}>
            <Text style={[styles.navText, styles.navShop]}>🛒 Shop</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.heroDiv}>
          <Ionicons name="car" size={72} color={SV.brown} />
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
            <Image source={require('../../assets/farmers.jpg')} style={styles.farmImg} resizeMode="cover" />
          </View>
        </View>

        {/* Featured Products — display only */}
        <View style={styles.sectionTitleDiv}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
        </View>
        <View style={styles.productsTable}>
          <View style={styles.productRow}>
            <View style={styles.productCell}>
              <Image source={require('../../assets/broccoli.jpg')} style={styles.productImg} resizeMode="cover" />
              <Text style={styles.productName}>Broccoli</Text>
            </View>
            <View style={styles.productCell}>
              <Image source={require('../../assets/outofstock.jpg')} style={styles.productImg} resizeMode="cover" />
            </View>
            <View style={styles.productCell}>
              <Image source={require('../../assets/carrots.png')} style={styles.productImg} resizeMode="cover" />
              <Text style={styles.productName}>Carrots</Text>
            </View>
          </View>
          <View style={styles.productRow}>
            <View style={styles.productCell}>
              <Image source={require('../../assets/outofstock.jpg')} style={styles.productImg} resizeMode="cover" />
            </View>
            <View style={styles.productCell}>
              <Image source={require('../../assets/tomato.png')} style={styles.productImg} resizeMode="cover" />
              <Text style={styles.productName}>Tomato</Text>
            </View>
            <View style={styles.productCell}>
              <Image source={require('../../assets/greenpeas.webp')} style={[styles.productImg, { borderRadius: 60 }]} resizeMode="cover" />
              <Text style={styles.productName}>Peas</Text>
            </View>
          </View>
        </View>

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
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: SV.greenLight, borderRadius: 25, margin: 8, padding: 12, gap: 16,
  },
  logo: { width: 80, height: 80 },

  nav: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: SV.sandybrown, marginHorizontal: 8,
    borderRadius: 12, paddingVertical: 12, marginBottom: 8,
  },
  navText: { color: SV.brown, fontWeight: '700', fontSize: 13 },
  navShop: { color: SV.green, backgroundColor: SV.greenLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },

  heroDiv: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SV.greenLight, borderRadius: 25, margin: 8, padding: 16, gap: 16,
  },
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

  productsTable: { backgroundColor: SV.brown, borderRadius: 16, margin: 8, padding: 6 },
  productRow: { flexDirection: 'row' },
  productCell: {
    flex: 1, backgroundColor: SV.sandybrown, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', margin: 4, padding: 10,
  },
  productImg: { width: 70, height: 70, borderRadius: 8 },
  productName: { color: SV.brown, fontWeight: '700', fontSize: 13, marginTop: 6 },

  awardsRow: { flexDirection: 'row', justifyContent: 'space-around', margin: 8, marginBottom: 16 },
  awardImg: { width: 90, height: 90, borderRadius: 12 },

  // Shop
  shopSection: { backgroundColor: SV.sandybrown, borderRadius: 16, margin: 8, padding: 12 },
  shopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shopCard: {
    width: '47%', backgroundColor: SV.greenLight, borderRadius: 12,
    alignItems: 'center', padding: 10, borderWidth: 2, borderColor: SV.brown,
  },
  shopImg: { width: 70, height: 70, borderRadius: 8, marginBottom: 6 },
  shopName: { color: SV.brown, fontWeight: '700', fontSize: 14 },
  shopPrice: { color: SV.brown, fontSize: 13, marginBottom: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    backgroundColor: SV.brown, width: 28, height: 28,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { color: SV.greenLight, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  qtyNum: { color: SV.brown, fontWeight: '700', fontSize: 16, minWidth: 20, textAlign: 'center' },
  basketBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: SV.brown, borderRadius: 12, padding: 12, marginTop: 12,
  },
  basketText: { color: SV.greenLight, fontWeight: '600', fontSize: 14, flex: 1 },
  checkoutBtn: { backgroundColor: SV.greenLight, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  checkoutText: { color: SV.brown, fontWeight: '700', fontSize: 14 },
  recentOrders: { marginTop: 12 },
  recentOrdersTitle: { color: SV.brown, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: SV.brown + '66' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 13, fontWeight: '600', color: SV.brown },
  txMeta: { fontSize: 11, color: '#5a3010' },
  txAmount: { fontSize: 13, fontWeight: '700', color: SV.brown },

  footerDiv: { backgroundColor: SV.greenLight, borderRadius: 25, margin: 8, marginBottom: 24, padding: 20 },
  footerTitle: { color: SV.brown, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  footerText: { color: SV.brown, fontSize: 14, lineHeight: 26 },
});
