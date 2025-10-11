import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import styles from "./styles";

import { fetchQuizzes } from "../../../services/apis/quizAPI";
import colors from "../../../theme/colors";
import QuizCard from "./QuizCard";
import { useUser } from "../../../context/UserContext";

const InteractiveQuiz = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        if (!user?.eco_id) {
          setTopics([]);
          setLoading(false);
          return;
        }

        setLoading(true);

        const data = await fetchQuizzes(user.eco_id);

        if (!data || !Array.isArray(data.data)) {
          console.warn("[InteractiveQuiz] No valid data in response", data);
          setTopics([]);
          return;
        }

        // Keep the real shape, don’t strip questions
        const mapped = data.data.map((topic, idx) => ({
          quiz_id: `quiz-${idx + 1}`,
          title: topic.topic_name,
          subtitle: topic.topic_description,
          question_count: topic.questions?.length || 0,
          status: "not_started",
          percent_complete: 0,
          questions: topic.questions || [],
        }));

        setTopics(mapped);
      } catch (error) {
        console.error("[InteractiveQuiz] Failed to load quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [user?.eco_id]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Interactive Quizzes</Text>
      <Text style={styles.sectionSubtitle}>
        Test your knowledge and learn something new.
      </Text>

      {loading ? (
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
          Loading quizzes...
        </Text>
      ) : (
        topics.map((quiz) => (
          <View key={quiz.quiz_id} style={styles.sectionItemSpacing}>
            <QuizCard quiz={quiz} />
          </View>
        ))
      )}
    </View>
  );
};

export default InteractiveQuiz;
