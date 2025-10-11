import { Ionicons } from "@expo/vector-icons";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

import colors from "../../../theme/colors";
import styles from "./styles";

const sections = [
  {
    body: [
      "TechTitans values and respects the privacy of the people we deal with. TechTitans is committed to protecting your privacy and complying with the Privacy Act 1988 (Cth) (Privacy Act) and other applicable privacy laws and regulations.",
      "This Privacy Policy (Policy) describes how we collect, hold, use and disclose your personal information, and how we maintain the quality and security of your personal information.",
    ],
  },
  {
    title: "What is personal information?",
    body: [
      '“Personal information” means any information or opinion, whether true or not, and whether recorded in a material form or not, about an identified individual or an individual who is reasonably identifiable. In general terms, this includes information or an opinion that personally identifies you either directly (e.g. your name) or indirectly.',
    ],
  },
  {
    title: "What personal information do we collect?",
    body: [
      "The personal information we collect about you depends on the nature of your dealings with us or what you choose to share with us.",
    ],
    bullets: ["Daily Activity", "Daily Carbon Footprint", "Asset", "Bills"],
    bodyAfter: [
      "You do not have to provide us with your personal information. Where possible, we will give you the option to interact with us anonymously or by using a pseudonym. However, if you choose to deal with us in this way or choose not to provide us with your personal information, we may not be able to provide you with our services or otherwise interact with you.",
    ],
  },
  {
    title: "How do we collect your personal information?",
    body: ["We collect your personal information directly from you when you:"],
    bullets: ["interact with us over the phone;", "participate in surveys or questionnaires;"],
  },
  {
    title: "How do we use your personal information?",
    body: [
      "We use personal information for many purposes in connection with our functions and activities, including the following purposes:",
    ],
    bullets: [
      "provide you with information or services that you request from us;",
      "deliver to you a more personalised experience and service offering;",
      "improve the quality of the services we offer;",
    ],
  },
  {
    title: "Disclosure of personal information to third parties",
    body: [
      "We may disclose your personal information to third parties in accordance with this Policy in circumstances where you would reasonably expect us to disclose your information. For example, we may disclose your personal information to:",
    ],
    bullets: ["our sponsors of retail & energy provider;", "our professional services advisors;"],
  },
  {
    title: "How do we protect your personal information?",
    body: [
      "TechTitans will take reasonable steps to ensure that the personal information that we hold about you is kept confidential and secure, including by:",
    ],
    bullets: [
      "having a robust physical security of our premises and databases / records;",
      "taking measures to restrict access to only personnel who need that personal information to effectively provide services to you;",
      "having technological measures in place (for example, anti-virus software, fire walls);",
    ],
  },
  {
    title: "Online activity",
    body: [
      "(Direct marketing)",
      "We may send you direct marketing communications and information about our services, opportunities, or events that we consider may be of interest to you if you have requested or consented to receive such communications. These communications may be sent in various forms, including SMS and email, in accordance with applicable marketing laws, such as the Australian Spam Act 2003 (Cth). You consent to us sending you those direct marketing communications by any of those methods. If you indicate a preference for a method of communication, we will endeavour to use that method whenever practical to do so.",
      "You may opt-out of receiving marketing communications from us at any time by clicking the unsubscribe button in the email.",
      "In addition, we may also use your personal information or disclose your personal information to third parties for the purposes of advertising, including online behavioural advertising, website personalisation, and to provide targeted or retargeted advertising content to you (including through third party websites).",
    ],
  },
  {
    title: "Retention of personal information",
    body: [
      "We will not keep your personal information for longer than we need to. In most cases, this means that we will only retain your personal information for the duration of your relationship with us unless we are required to retain your personal information to comply with applicable laws, for example record-keeping obligations.",
    ],
  },
  {
    title: "How to access and correct your personal information",
    body: [
      "TechTitans will endeavour to keep your personal information accurate, complete and up to date.",
      "If you wish to make a request to access and / or correct the personal information we hold about you, you should make a request by contacting us and we will usually respond within 3 days. We will deal with such a request by following the procedure outlined below:",
    ],
    bullets: [
      "Send an enquiry email to our customer service email verde.cs@gmail.com;",
      "Specific the request with attachments if any;",
    ],
  },
  {
    title: "Links to third party sites",
    body: [
      "TechTitans application(s) may contain links to websites operated by third parties. If you access a third party website through our website(s), personal information may be collected by that third party website. We make no representations or warranties in relation to the privacy practices of any third party provider or website and we are not responsible for the privacy policies or the content of any third party provider or website. Third party providers / websites are responsible for informing you about their own privacy practices and we encourage you to read their privacy policies.",
    ],
  },
  {
    title: "Inquiries and complaints",
    body: [
      "For complaints about how TechTitans handles, processes or manages your personal information, please contact verde.cs@gmail.com. Note we may require proof of your identity and full details of your request before we can process your complaint.",
      "Please allow up to 3 days for TechTitans to respond to your complaint. It will not always be possible to resolve a complaint to everyone’s satisfaction. If you are not satisfied with TechTitans’s response to a complaint, you have the right to contact the Office of Australian Information Commissioner (at www.oaic.gov.au/) to lodge a complaint.",
    ],
  },
  {
    title: "How to contact us",
    body: [
      "If you have a question or concern in relation to our handling of your personal information or this Policy, you can contact us for assistance as follows:",
      "Email",
      "verde.cs@gmail.com",
    ],
  },
];

const PrivacyPolicyModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Verde Privacy Policy</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close privacy policy"
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator
            contentContainerStyle={styles.contentContainer}
          >
            {sections.map((section, index) => (
              <View key={`${section.title ?? "intro"}-${index}`} style={styles.section}>
                {section.title && (
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                )}
                {(section.body ?? []).map((paragraph, idx) => (
                  <Text key={`body-${idx}`} style={styles.paragraph}>
                    {paragraph}
                  </Text>
                ))}
                {(section.bullets ?? []).map((item, idx) => (
                  <View key={`bullet-${idx}`} style={styles.bulletRow}>
                    <Text style={styles.bulletSymbol}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
                {(section.bodyAfter ?? []).map((paragraph, idx) => (
                  <Text key={`bodyAfter-${idx}`} style={styles.paragraph}>
                    {paragraph}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PrivacyPolicyModal;
