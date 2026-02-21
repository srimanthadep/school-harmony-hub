
-- ============================================================
-- School Harmony Hub: Fee Management Enhancements
-- ============================================================

-- 1. School settings (single-row configuration table)
CREATE TABLE public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL DEFAULT 'School Harmony Hub',
  school_address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  principal_name TEXT,
  academic_year TEXT NOT NULL DEFAULT '2024-25',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  receipt_prefix TEXT NOT NULL DEFAULT 'REC',
  slip_prefix TEXT NOT NULL DEFAULT 'SLP',
  last_receipt_no INTEGER NOT NULL DEFAULT 0,
  last_slip_no INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Fee structures (per class + academic year)
CREATE TABLE public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  tuition_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  admission_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  exam_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  library_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  sports_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  transport_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  misc_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_fee NUMERIC(10,2) GENERATED ALWAYS AS (
    tuition_fee + admission_fee + exam_fee + library_fee + sports_fee + transport_fee + misc_fee
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(class, academic_year)
);

-- 3. Book fee structures (per class + academic year)
CREATE TABLE public.book_fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  reading_book_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  text_books_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  practice_work_book_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  fun_with_dot_book_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  dairy_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  id_card_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  covers_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  note_books_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  misc_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_fee NUMERIC(10,2) GENERATED ALWAYS AS (
    reading_book_fee + text_books_fee + practice_work_book_fee + fun_with_dot_book_fee +
    dairy_fee + id_card_fee + covers_fee + note_books_fee + misc_fee
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(class, academic_year)
);

-- 4. Extend students table
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS total_book_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS academic_year TEXT NOT NULL DEFAULT '2024-25',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 5. Extend fee_payments table
ALTER TABLE public.fee_payments
  ADD COLUMN IF NOT EXISTS fee_type TEXT NOT NULL DEFAULT 'tuition',
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. Extend salary_payments table
ALTER TABLE public.salary_payments
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 7. Enable RLS on new tables
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_fee_structures ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies
CREATE POLICY "Admins can manage school settings" ON public.school_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read school settings" ON public.school_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage fee structures" ON public.fee_structures
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read fee structures" ON public.fee_structures
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage book fee structures" ON public.book_fee_structures
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read book fee structures" ON public.book_fee_structures
  FOR SELECT TO authenticated USING (true);

-- 9. Triggers for updated_at on new tables
CREATE TRIGGER update_fee_structures_updated_at BEFORE UPDATE ON public.fee_structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_book_fee_structures_updated_at BEFORE UPDATE ON public.book_fee_structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Function: apply fee structure to active students in a class/year
CREATE OR REPLACE FUNCTION public.apply_fee_structure(_class TEXT, _academic_year TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_fee NUMERIC(10,2);
  _affected INTEGER;
BEGIN
  SELECT total_fee INTO _total_fee
  FROM public.fee_structures
  WHERE class = _class AND academic_year = _academic_year;

  IF _total_fee IS NULL THEN RETURN 0; END IF;

  UPDATE public.students
  SET total_fee = _total_fee, updated_at = now()
  WHERE class = _class AND academic_year = _academic_year AND status = 'active';

  GET DIAGNOSTICS _affected = ROW_COUNT;
  RETURN _affected;
END;
$$;

-- 11. Function: apply book fee structure to active students in a class/year
CREATE OR REPLACE FUNCTION public.apply_book_fee_structure(_class TEXT, _academic_year TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_fee NUMERIC(10,2);
  _affected INTEGER;
BEGIN
  SELECT total_fee INTO _total_fee
  FROM public.book_fee_structures
  WHERE class = _class AND academic_year = _academic_year;

  IF _total_fee IS NULL THEN RETURN 0; END IF;

  UPDATE public.students
  SET total_book_fee = _total_fee, updated_at = now()
  WHERE class = _class AND academic_year = _academic_year AND status = 'active';

  GET DIAGNOSTICS _affected = ROW_COUNT;
  RETURN _affected;
END;
$$;

-- 12. Function: promote active students from one year to the next
CREATE OR REPLACE FUNCTION public.promote_students(_from_year TEXT, _to_year TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  CLASS_ORDER TEXT[] := ARRAY[
    'Nursery','LKG','UKG',
    '1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th'
  ];
  _student RECORD;
  _current_idx INTEGER;
  _next_class TEXT;
  _affected INTEGER := 0;
BEGIN
  FOR _student IN
    SELECT id, class
    FROM public.students
    WHERE academic_year = _from_year AND status = 'active'
  LOOP
    _current_idx := array_position(CLASS_ORDER, _student.class);
    IF _current_idx IS NULL THEN CONTINUE; END IF;

    IF _current_idx >= array_length(CLASS_ORDER, 1) THEN
      -- Graduate: mark inactive
      UPDATE public.students
      SET status = 'inactive', updated_at = now()
      WHERE id = _student.id;
    ELSE
      _next_class := CLASS_ORDER[_current_idx + 1];
      UPDATE public.students
      SET
        class = _next_class,
        academic_year = _to_year,
        total_fee = COALESCE(
          (SELECT total_fee FROM public.fee_structures
           WHERE class = _next_class AND academic_year = _to_year),
          0
        ),
        total_book_fee = COALESCE(
          (SELECT total_fee FROM public.book_fee_structures
           WHERE class = _next_class AND academic_year = _to_year),
          0
        ),
        updated_at = now()
      WHERE id = _student.id;
    END IF;

    _affected := _affected + 1;
  END LOOP;

  RETURN _affected;
END;
$$;

-- 13. Seed default school settings row
INSERT INTO public.school_settings (school_name, academic_year, currency_symbol, receipt_prefix, slip_prefix)
VALUES ('School Harmony Hub', '2024-25', '₹', 'REC', 'SLP');
