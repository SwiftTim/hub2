-- Insert sample assessments for testing
INSERT INTO assessments (unit_id, title, description, assessment_type, total_marks, duration_minutes, start_time, end_time, instructions, anti_cheat_enabled, randomize_questions, show_results, created_by)
SELECT 
  u.id,
  'CAT 1 - ' || u.unit_name,
  'First Continuous Assessment Test for ' || u.unit_name,
  'cat',
  50,
  90,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '7 days',
  'Read all questions carefully. You have 90 minutes to complete this assessment. Ensure stable internet connection.',
  true,
  true,
  false,
  (SELECT id FROM users WHERE role = 'lecturer' LIMIT 1)
FROM units u
LIMIT 3;

-- Insert sample questions for the first assessment
INSERT INTO assessment_questions (assessment_id, question_text, question_type, options, correct_answer, marks, order_index)
SELECT 
  a.id,
  'What is the primary purpose of data structures in computer science?',
  'multiple_choice',
  '["To store data efficiently", "To make programs look complex", "To slow down execution", "To use more memory"]'::jsonb,
  'To store data efficiently',
  10,
  1
FROM assessments a
WHERE a.title LIKE '%CS201%'
LIMIT 1;

INSERT INTO assessment_questions (assessment_id, question_text, question_type, options, correct_answer, marks, order_index)
SELECT 
  a.id,
  'Arrays provide constant time access to elements.',
  'true_false',
  '["True", "False"]'::jsonb,
  'True',
  5,
  2
FROM assessments a
WHERE a.title LIKE '%CS201%'
LIMIT 1;

INSERT INTO assessment_questions (assessment_id, question_text, question_type, correct_answer, marks, order_index)
SELECT 
  a.id,
  'Explain the difference between a stack and a queue data structure.',
  'short_answer',
  null,
  'A stack follows LIFO (Last In First Out) principle while a queue follows FIFO (First In First Out) principle.',
  15,
  3
FROM assessments a
WHERE a.title LIKE '%CS201%'
LIMIT 1;

INSERT INTO assessment_questions (assessment_id, question_text, question_type, correct_answer, marks, order_index)
SELECT 
  a.id,
  'Discuss the time complexity analysis of common sorting algorithms and provide examples.',
  'essay',
  null,
  'Sample answer discussing O(n²) for bubble sort, O(n log n) for merge sort, etc.',
  20,
  4
FROM assessments a
WHERE a.title LIKE '%CS201%'
LIMIT 1;
