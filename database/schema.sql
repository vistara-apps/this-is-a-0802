-- TherapyTrack Database Schema
-- Supabase PostgreSQL Schema for TherapyTrack Application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_type AS ENUM ('patient', 'therapist', 'admin');
CREATE TYPE exercise_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid');
CREATE TYPE feedback_type AS ENUM ('text', 'video', 'audio');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_type user_type NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Therapists table
CREATE TABLE therapists (
    therapist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    practice_name TEXT NOT NULL,
    license_number TEXT,
    specialization TEXT[],
    years_experience INTEGER,
    bio TEXT,
    stripe_customer_id TEXT UNIQUE,
    subscription_id TEXT,
    subscription_status subscription_status DEFAULT 'unpaid',
    subscription_plan TEXT,
    max_patients INTEGER DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    therapist_id UUID REFERENCES therapists(therapist_id) ON DELETE SET NULL,
    condition_description TEXT,
    injury_date DATE,
    treatment_start_date DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise library table
CREATE TABLE exercise_library (
    exercise_lib_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    category TEXT,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    target_body_parts TEXT[],
    equipment_needed TEXT[],
    video_demo_url TEXT,
    image_url TEXT,
    created_by UUID REFERENCES therapists(therapist_id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE prescriptions (
    prescription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE NOT NULL,
    therapist_id UUID REFERENCES therapists(therapist_id) ON DELETE CASCADE NOT NULL,
    exercise_lib_id UUID REFERENCES exercise_library(exercise_lib_id) ON DELETE CASCADE NOT NULL,
    sets INTEGER NOT NULL DEFAULT 1,
    reps INTEGER NOT NULL DEFAULT 1,
    frequency TEXT NOT NULL, -- e.g., "Daily", "3x per week"
    duration_weeks INTEGER,
    special_instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table (instances of prescribed exercises)
CREATE TABLE exercises (
    exercise_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE NOT NULL,
    prescription_id UUID REFERENCES prescriptions(prescription_id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    instructions TEXT NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    frequency TEXT NOT NULL,
    status exercise_status DEFAULT 'pending',
    scheduled_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise completions table
CREATE TABLE exercise_completions (
    completion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID REFERENCES exercises(exercise_id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sets_completed INTEGER,
    reps_completed INTEGER,
    duration_seconds INTEGER,
    pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    notes TEXT,
    video_url TEXT, -- IPFS hash
    video_thumbnail_url TEXT, -- IPFS hash
    ai_analysis JSONB, -- Store AI analysis results
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise feedback table
CREATE TABLE exercise_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID REFERENCES exercises(exercise_id) ON DELETE CASCADE NOT NULL,
    completion_id UUID REFERENCES exercise_completions(completion_id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES therapists(therapist_id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE NOT NULL,
    feedback_type feedback_type NOT NULL,
    content TEXT NOT NULL,
    video_url TEXT, -- For video feedback
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress tracking table
CREATE TABLE progress_tracking (
    progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE NOT NULL,
    therapist_id UUID REFERENCES therapists(therapist_id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    overall_pain_level INTEGER CHECK (overall_pain_level >= 0 AND overall_pain_level <= 10),
    mobility_score INTEGER CHECK (mobility_score >= 1 AND mobility_score <= 10),
    strength_score INTEGER CHECK (strength_score >= 1 AND strength_score <= 10),
    adherence_rate DECIMAL(5,2), -- Percentage
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, date)
);

-- Notifications table
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'reminder', 'feedback', 'system', etc.
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription usage tracking
CREATE TABLE subscription_usage (
    usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID REFERENCES therapists(therapist_id) ON DELETE CASCADE NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    patient_count INTEGER DEFAULT 0,
    video_storage_mb INTEGER DEFAULT 0,
    ai_analysis_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(therapist_id, month, year)
);

-- Create indexes for better performance
CREATE INDEX idx_patients_therapist_id ON patients(therapist_id);
CREATE INDEX idx_exercises_patient_id ON exercises(patient_id);
CREATE INDEX idx_exercise_completions_exercise_id ON exercise_completions(exercise_id);
CREATE INDEX idx_exercise_completions_patient_id ON exercise_completions(patient_id);
CREATE INDEX idx_exercise_completions_completed_at ON exercise_completions(completed_at);
CREATE INDEX idx_exercise_feedback_patient_id ON exercise_feedback(patient_id);
CREATE INDEX idx_exercise_feedback_therapist_id ON exercise_feedback(therapist_id);
CREATE INDEX idx_progress_tracking_patient_id ON progress_tracking(patient_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_therapist_id ON prescriptions(therapist_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Therapists policies
CREATE POLICY "Therapists can view own data" ON therapists FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Therapists can update own data" ON therapists FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Therapists can insert own data" ON therapists FOR INSERT WITH CHECK (user_id = auth.uid());

-- Patients policies
CREATE POLICY "Patients can view own data" ON patients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Therapists can view their patients" ON patients FOR SELECT USING (
    therapist_id IN (SELECT therapist_id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY "Patients can update own data" ON patients FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Therapists can update their patients" ON patients FOR UPDATE USING (
    therapist_id IN (SELECT therapist_id FROM therapists WHERE user_id = auth.uid())
);

-- Exercise library policies
CREATE POLICY "Public exercises are viewable by all" ON exercise_library FOR SELECT USING (is_public = true);
CREATE POLICY "Therapists can view own exercises" ON exercise_library FOR SELECT USING (
    created_by IN (SELECT therapist_id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY "Therapists can manage own exercises" ON exercise_library FOR ALL USING (
    created_by IN (SELECT therapist_id FROM therapists WHERE user_id = auth.uid())
);

-- Prescriptions policies
CREATE POLICY "Patients can view own prescriptions" ON prescriptions FOR SELECT USING (
    patient_id IN (SELECT patient_id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Therapists can view their patients' prescriptions" ON prescriptions FOR SELECT USING (
    therapist_id IN (SELECT therapist_id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY "Therapists can manage their patients' prescriptions" ON prescriptions FOR ALL USING (
    therapist_id IN (SELECT therapist_id FROM therapists WHERE user_id = auth.uid())
);

-- Exercises policies
CREATE POLICY "Patients can view own exercises" ON exercises FOR SELECT USING (
    patient_id IN (SELECT patient_id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Therapists can view their patients' exercises" ON exercises FOR SELECT USING (
    patient_id IN (SELECT patient_id FROM patients WHERE therapist_id IN (
        SELECT therapist_id FROM therapists WHERE user_id = auth.uid()
    ))
);

-- Exercise completions policies
CREATE POLICY "Patients can manage own completions" ON exercise_completions FOR ALL USING (
    patient_id IN (SELECT patient_id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Therapists can view their patients' completions" ON exercise_completions FOR SELECT USING (
    patient_id IN (SELECT patient_id FROM patients WHERE therapist_id IN (
        SELECT therapist_id FROM therapists WHERE user_id = auth.uid()
    ))
);

-- Exercise feedback policies
CREATE POLICY "Patients can view own feedback" ON exercise_feedback FOR SELECT USING (
    patient_id IN (SELECT patient_id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Therapists can manage feedback for their patients" ON exercise_feedback FOR ALL USING (
    therapist_id IN (SELECT therapist_id FROM therapists WHERE user_id = auth.uid())
);

-- Progress tracking policies
CREATE POLICY "Patients can view own progress" ON progress_tracking FOR SELECT USING (
    patient_id IN (SELECT patient_id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Therapists can manage their patients' progress" ON progress_tracking FOR ALL USING (
    therapist_id IN (SELECT therapist_id FROM therapists WHERE user_id = auth.uid())
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Subscription usage policies
CREATE POLICY "Therapists can view own usage" ON subscription_usage FOR SELECT USING (
    therapist_id IN (SELECT therapist_id FROM therapists WHERE user_id = auth.uid())
);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON therapists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercise_library_updated_at BEFORE UPDATE ON exercise_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercise_feedback_updated_at BEFORE UPDATE ON exercise_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_usage_updated_at BEFORE UPDATE ON subscription_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate adherence rate
CREATE OR REPLACE FUNCTION calculate_adherence_rate(p_patient_id UUID, p_days INTEGER DEFAULT 30)
RETURNS DECIMAL AS $$
DECLARE
    total_exercises INTEGER;
    completed_exercises INTEGER;
BEGIN
    -- Count total exercises assigned in the last p_days days
    SELECT COUNT(*) INTO total_exercises
    FROM exercises
    WHERE patient_id = p_patient_id
    AND created_at >= NOW() - INTERVAL '1 day' * p_days;
    
    -- Count completed exercises in the last p_days days
    SELECT COUNT(*) INTO completed_exercises
    FROM exercises e
    JOIN exercise_completions ec ON e.exercise_id = ec.exercise_id
    WHERE e.patient_id = p_patient_id
    AND ec.completed_at >= NOW() - INTERVAL '1 day' * p_days;
    
    -- Return adherence rate as percentage
    IF total_exercises = 0 THEN
        RETURN 0;
    ELSE
        RETURN ROUND((completed_exercises::DECIMAL / total_exercises::DECIMAL) * 100, 2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update subscription usage
CREATE OR REPLACE FUNCTION update_subscription_usage()
RETURNS TRIGGER AS $$
DECLARE
    current_month INTEGER := EXTRACT(MONTH FROM NOW());
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
    therapist_uuid UUID;
BEGIN
    -- Get therapist_id from patient
    SELECT t.therapist_id INTO therapist_uuid
    FROM patients p
    JOIN therapists t ON p.therapist_id = t.therapist_id
    WHERE p.patient_id = NEW.patient_id;
    
    -- Update or insert usage record
    INSERT INTO subscription_usage (therapist_id, month, year, ai_analysis_count)
    VALUES (therapist_uuid, current_month, current_year, 1)
    ON CONFLICT (therapist_id, month, year)
    DO UPDATE SET
        ai_analysis_count = subscription_usage.ai_analysis_count + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update usage when AI analysis is performed
CREATE TRIGGER update_usage_on_completion
    AFTER INSERT ON exercise_completions
    FOR EACH ROW
    WHEN (NEW.ai_analysis IS NOT NULL)
    EXECUTE FUNCTION update_subscription_usage();

-- Insert some sample data for development
INSERT INTO exercise_library (name, description, instructions, category, difficulty_level, target_body_parts, is_public) VALUES
('Knee Extension', 'Strengthen quadriceps muscles', 'Sit on chair, straighten leg, hold for 5 seconds', 'Strength', 2, ARRAY['knee', 'quadriceps'], true),
('Ankle Pumps', 'Improve ankle mobility and circulation', 'Point toes up and down slowly', 'Mobility', 1, ARRAY['ankle', 'calf'], true),
('Calf Raises', 'Strengthen calf muscles', 'Rise up on toes, lower slowly', 'Strength', 2, ARRAY['calf', 'ankle'], true),
('Shoulder Rolls', 'Improve shoulder mobility', 'Roll shoulders forward and backward in circular motion', 'Mobility', 1, ARRAY['shoulder'], true),
('Wall Push-ups', 'Upper body strengthening', 'Stand arm length from wall, push against wall', 'Strength', 3, ARRAY['chest', 'arms', 'shoulders'], true);

-- Create a view for patient dashboard data
CREATE VIEW patient_dashboard AS
SELECT 
    p.patient_id,
    p.user_id,
    pr.first_name,
    pr.last_name,
    COUNT(e.exercise_id) as total_exercises,
    COUNT(ec.completion_id) as completed_exercises,
    calculate_adherence_rate(p.patient_id) as adherence_rate,
    MAX(ec.completed_at) as last_activity
FROM patients p
JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN exercises e ON p.patient_id = e.patient_id
LEFT JOIN exercise_completions ec ON e.exercise_id = ec.exercise_id
GROUP BY p.patient_id, p.user_id, pr.first_name, pr.last_name;

-- Create a view for therapist dashboard data
CREATE VIEW therapist_dashboard AS
SELECT 
    t.therapist_id,
    t.user_id,
    pr.first_name,
    pr.last_name,
    t.practice_name,
    COUNT(DISTINCT p.patient_id) as total_patients,
    COUNT(DISTINCT ec.completion_id) as total_completions,
    AVG(calculate_adherence_rate(p.patient_id)) as avg_adherence_rate,
    t.subscription_status,
    t.subscription_plan
FROM therapists t
JOIN profiles pr ON t.user_id = pr.id
LEFT JOIN patients p ON t.therapist_id = p.therapist_id
LEFT JOIN exercises e ON p.patient_id = e.patient_id
LEFT JOIN exercise_completions ec ON e.exercise_id = ec.exercise_id
GROUP BY t.therapist_id, t.user_id, pr.first_name, pr.last_name, t.practice_name, t.subscription_status, t.subscription_plan;
