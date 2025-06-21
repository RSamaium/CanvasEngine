export default {
  title: "Grade System with @if/@else if/@else",
  description: "Click the buttons to change the score and see different grades",
  files: {
    "app.ce": `<Canvas backgroundColor="#2c3e50" width="100%" height="100%">
    <Container 
        width="100%" 
        height="100%" 
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={30}>
        
        <Text text={scoreStr} color="white" size={24} />
        
        @if (score >= 90) {
            <Text text="Grade: A+" color="#FFD700" size={48} fontWeight="bold" />
            <Text text="Excellent work!" color="#FFD700" size={18} />
        }
        @else if (score >= 80) {
            <Text text="Grade: A" color="#32CD32" size={48} fontWeight="bold" />
            <Text text="Great job!" color="#32CD32" size={18} />
        }
        @else if (score >= 70) {
            <Text text="Grade: B" color="#1E90FF" size={48} fontWeight="bold" />
            <Text text="Good work!" color="#1E90FF" size={18} />
        }
        @else if (score >= 60) {
            <Text text="Grade: C" color="#FFA500" size={48} fontWeight="bold" />
            <Text text="Keep trying!" color="#FFA500" size={18} />
        }
        @else {
            <Text text="Grade: F" color="#FF6347" size={48} fontWeight="bold" />
            <Text text="Need improvement" color="#FF6347" size={18} />
        }
    
    </Container>
</Canvas>

<script>
import { signal } from 'canvasengine';

const score = signal(85);
const scoreStr = computed(() => \`Score: \${score()}\`);
</script>`
  }
}; 