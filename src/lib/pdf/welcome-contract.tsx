import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

type WelcomeContractInput = {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  planName: string;
  currencyCode: string;
  languageCode: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 42,
    fontFamily: "Helvetica",
    color: "#0f172a"
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 8
  },
  subtitle: {
    color: "#475569",
    fontSize: 11,
    marginBottom: 28
  },
  section: {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 14
  },
  label: {
    color: "#64748b",
    fontSize: 9,
    textTransform: "uppercase",
    marginBottom: 4
  },
  value: {
    fontSize: 12,
    marginBottom: 10
  },
  footer: {
    marginTop: 28,
    fontSize: 10,
    color: "#64748b"
  }
});

function WelcomeContractDocument({
  companyName,
  ownerName,
  ownerEmail,
  planName,
  currencyCode,
  languageCode
}: WelcomeContractInput) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>KIM-ERB Welcome Contract</Text>
        <Text style={styles.subtitle}>Ultimate business management platform</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Company</Text>
          <Text style={styles.value}>{companyName}</Text>
          <Text style={styles.label}>Owner</Text>
          <Text style={styles.value}>{ownerName}</Text>
          <Text style={styles.label}>Owner Email</Text>
          <Text style={styles.value}>{ownerEmail}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Subscription Plan</Text>
          <Text style={styles.value}>{planName}</Text>
          <Text style={styles.label}>Default Currency</Text>
          <Text style={styles.value}>{currencyCode}</Text>
          <Text style={styles.label}>Default Language</Text>
          <Text style={styles.value}>{languageCode}</Text>
        </View>
        <Text style={styles.footer}>
          Support: kimerb10@gmail.com | WhatsApp: +49 177 7952971
        </Text>
      </Page>
    </Document>
  );
}

export async function generateWelcomeContract(input: WelcomeContractInput) {
  return renderToBuffer(<WelcomeContractDocument {...input} />);
}
