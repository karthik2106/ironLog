insert into public.exercises (id, user_id, name, primary_muscle, secondary_muscles, equipment, category, instructions, is_custom)
values
  ('00000000-0000-0000-0000-000000000101', null, 'Incline dumbbell press', 'Chest', array['Shoulders','Triceps'], 'Dumbbells', 'compound', 'Set the bench to a low incline, keep shoulder blades pinned, and press with controlled reps.', false),
  ('00000000-0000-0000-0000-000000000102', null, 'Machine shoulder press', 'Shoulders', array['Triceps'], 'Machine', 'machine', 'Brace against the pad and press overhead without locking out aggressively.', false),
  ('00000000-0000-0000-0000-000000000103', null, 'Cable lateral raise', 'Shoulders', '{}', 'Cable', 'isolation', 'Lead with the elbow and stop when the upper arm reaches shoulder height.', false),
  ('00000000-0000-0000-0000-000000000104', null, 'Triceps pushdown', 'Triceps', '{}', 'Cable', 'isolation', 'Keep elbows still and extend fully at the bottom.', false),
  ('00000000-0000-0000-0000-000000000105', null, 'Overhead triceps extension', 'Triceps', '{}', 'Cable', 'isolation', 'Let the elbows flex deeply, then extend without flaring excessively.', false),
  ('00000000-0000-0000-0000-000000000106', null, 'Lat pulldown', 'Back', array['Biceps'], 'Cable', 'compound', 'Pull elbows toward the ribs and pause briefly near the chest.', false),
  ('00000000-0000-0000-0000-000000000107', null, 'Chest-supported row', 'Back', array['Biceps'], 'Machine', 'compound', 'Keep the chest fixed to the pad and row with elbows close to the body.', false),
  ('00000000-0000-0000-0000-000000000108', null, 'Rear-delt fly', 'Shoulders', array['Back'], 'Machine', 'isolation', 'Open the arms with a soft elbow and squeeze the rear delts.', false),
  ('00000000-0000-0000-0000-000000000109', null, 'Incline dumbbell curl', 'Biceps', '{}', 'Dumbbells', 'isolation', 'Let the arm extend fully and curl without moving the shoulder.', false),
  ('00000000-0000-0000-0000-000000000110', null, 'Hammer curl', 'Biceps', '{}', 'Dumbbells', 'isolation', 'Curl with neutral wrists and avoid torso sway.', false),
  ('00000000-0000-0000-0000-000000000111', null, 'Squat or leg press', 'Quadriceps', array['Glutes'], 'Barbell or machine', 'compound', 'Use a controlled depth and keep tension through the entire rep.', false),
  ('00000000-0000-0000-0000-000000000112', null, 'Romanian deadlift', 'Hamstrings', array['Glutes','Back'], 'Barbell or dumbbells', 'compound', 'Hinge at the hips, keep lats tight, and stop when hamstrings limit range.', false),
  ('00000000-0000-0000-0000-000000000113', null, 'Bulgarian split squat', 'Quadriceps', array['Glutes'], 'Dumbbells', 'compound', 'Keep the front foot planted and descend under control on each leg.', false),
  ('00000000-0000-0000-0000-000000000114', null, 'Seated or lying leg curl', 'Hamstrings', '{}', 'Machine', 'isolation', 'Curl hard and return slowly without losing tension.', false),
  ('00000000-0000-0000-0000-000000000115', null, 'Standing calf raise', 'Calves', '{}', 'Machine', 'isolation', 'Pause at the top and use a full stretch at the bottom.', false)
on conflict (id) do nothing;
