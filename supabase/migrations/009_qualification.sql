-- ── AI Qualification Panel ────────────────────────────────────────────────────

-- qualification_templates: seeded with 10 lead type templates
CREATE TABLE IF NOT EXISTS qualification_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_type    TEXT UNIQUE NOT NULL,
  label        TEXT NOT NULL,
  description  TEXT,
  questions    JSONB NOT NULL DEFAULT '[]',
  heat_thresholds JSONB NOT NULL DEFAULT '{"hot": 70, "warm": 40}',
  reply_templates JSONB NOT NULL DEFAULT '{}',
  next_actions    JSONB NOT NULL DEFAULT '{}',
  crm_fields      JSONB NOT NULL DEFAULT '[]',
  deal_fields     JSONB NOT NULL DEFAULT '[]'
);

-- qualification_sessions: one per qualification run
CREATE TABLE IF NOT EXISTS qualification_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_type        TEXT NOT NULL,
  contact_id       UUID REFERENCES contacts(id) ON DELETE SET NULL,
  conversation_id  UUID REFERENCES inbox_conversations(id) ON DELETE SET NULL,
  answers          JSONB NOT NULL DEFAULT '{}',
  score            INTEGER NOT NULL DEFAULT 0,
  heat             TEXT NOT NULL DEFAULT 'cold' CHECK (heat IN ('hot','warm','cold')),
  notes            TEXT,
  suggested_reply  TEXT,
  next_action      TEXT,
  created_by       TEXT
);

CREATE INDEX IF NOT EXISTS idx_qual_sessions_contact ON qualification_sessions(contact_id);
CREATE INDEX IF NOT EXISTS idx_qual_sessions_conv    ON qualification_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_qual_sessions_type    ON qualification_sessions(lead_type);

-- RLS (open for now — tighten with auth later)
ALTER TABLE qualification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_sessions  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all qualification_templates" ON qualification_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all qualification_sessions"  ON qualification_sessions  FOR ALL USING (true) WITH CHECK (true);

-- ── Seed: 10 lead type templates ──────────────────────────────────────────────

INSERT INTO qualification_templates (lead_type, label, description, questions, heat_thresholds, reply_templates, next_actions, crm_fields, deal_fields)
VALUES

-- 1. LANDLORD
('landlord', 'Landlord', 'Property owner looking for management, lettings or sale services.',
$$[
  {"id":"q1","text":"How many properties do you currently own?","type":"select","options":[{"value":"1","label":"1 property","score":10},{"value":"2-5","label":"2–5 properties","score":25},{"value":"6+","label":"6+ properties","score":40}]},
  {"id":"q2","text":"Are these properties currently let?","type":"select","options":[{"value":"yes_all","label":"Yes, all let","score":15},{"value":"some","label":"Some let","score":10},{"value":"no","label":"No, vacant","score":5}]},
  {"id":"q3","text":"Are you looking for a new lettings agent or general management?","type":"select","options":[{"value":"new_agent","label":"Yes, switching agents","score":30},{"value":"management","label":"Full management wanted","score":25},{"value":"just_enquiring","label":"Just enquiring","score":5}]},
  {"id":"q4","text":"What is your main pain point with current management?","type":"select","options":[{"value":"voids","label":"Too many voids","score":20},{"value":"maintenance","label":"Maintenance issues","score":15},{"value":"bad_agent","label":"Bad agent","score":20},{"value":"rent_arrears","label":"Rent arrears","score":15},{"value":"none","label":"No current issues","score":5}]},
  {"id":"q5","text":"Are you open to selling any properties?","type":"select","options":[{"value":"yes","label":"Yes, actively","score":20},{"value":"maybe","label":"Maybe in future","score":10},{"value":"no","label":"No, keep all","score":0}]}
]$$,
'{"hot":70,"warm":40}',
'{"hot":"Hi [Name], great to connect! With [X] properties you are exactly the kind of portfolio landlord we love working with. I would love to show you how we can reduce voids, handle maintenance and maximise your returns — can we jump on a quick call this week?","warm":"Hi [Name], thanks for reaching out. We work with a number of landlords in your area and there could be a real opportunity to improve your current setup. Would it be worth a quick chat to explore what we can do for you?","cold":"Hi [Name], thanks for getting in touch! We help landlords across the region get the most from their properties. If your situation changes or you want to explore your options, we are always happy to help."}',
'{"hot":"Book discovery call within 24h — qualify portfolio size and pain point, send management fee comparison","warm":"Send lettings brochure + case study, follow up in 3 days","cold":"Add to nurture sequence, check back in 30 days"}',
'["lead_type","status","company","notes","follow_up_date"]',
'["deal_value","deal_type","notes"]'),

-- 2. INVESTOR
('investor', 'Investor', 'Looking to acquire investment properties or portfolios.',
$$[
  {"id":"q1","text":"What type of investment are you looking for?","type":"select","options":[{"value":"btl","label":"Buy-to-let","score":20},{"value":"hmo","label":"HMO","score":30},{"value":"sa","label":"Serviced accommodation","score":30},{"value":"flip","label":"Flip/refurb","score":25},{"value":"commercial","label":"Commercial","score":20}]},
  {"id":"q2","text":"What is your budget range?","type":"select","options":[{"value":"under100k","label":"Under £100k","score":5},{"value":"100_250","label":"£100k–£250k","score":15},{"value":"250_500","label":"£250k–£500k","score":25},{"value":"500k+","label":"£500k+","score":40}]},
  {"id":"q3","text":"Do you have finance in place?","type":"select","options":[{"value":"cash","label":"Cash buyer","score":40},{"value":"mortgage_agreed","label":"Mortgage agreed in principle","score":30},{"value":"arranging","label":"Arranging finance","score":15},{"value":"no","label":"Not yet","score":5}]},
  {"id":"q4","text":"How quickly are you looking to move?","type":"select","options":[{"value":"now","label":"Ready to buy now","score":30},{"value":"3months","label":"Within 3 months","score":20},{"value":"6months","label":"3–6 months","score":10},{"value":"12months+","label":"12+ months","score":5}]},
  {"id":"q5","text":"Have you invested in property before?","type":"select","options":[{"value":"portfolio","label":"Yes, have a portfolio","score":20},{"value":"one","label":"Yes, one property","score":10},{"value":"no","label":"First time investor","score":5}]}
]$$,
'{"hot":75,"warm":45}',
'{"hot":"Hi [Name], you sound like exactly the kind of serious investor we love working with. We have off-market deals coming through regularly and I would love to get you on our preferred buyer list — can we arrange a call to discuss your criteria?","warm":"Hi [Name], great to hear you are looking at property investment. We work with investors at every stage and have some good opportunities in the pipeline. Worth a quick chat to see if anything fits your criteria?","cold":"Hi [Name], thanks for getting in touch about property investment. We will keep you in mind as opportunities come through — feel free to reach out when you are ready to move forward."}',
'{"hot":"Add to hot buyer list immediately, send current off-market deals, book sourcing call within 48h","warm":"Send investor pack and recent deal examples, follow up in 5 days","cold":"Add to investor newsletter, nurture over 60 days"}',
'["lead_type","status","notes","follow_up_date"]',
'["deal_value","deal_type","expected_roi","notes"]'),

-- 3. DEVELOPER
('developer', 'Developer', 'Property developer looking for land, planning or build opportunities.',
$$[
  {"id":"q1","text":"What type of development are you focused on?","type":"select","options":[{"value":"residential","label":"Residential (houses/flats)","score":20},{"value":"conversion","label":"Conversion (office to resi)","score":20},{"value":"commercial","label":"Commercial","score":15},{"value":"mixed","label":"Mixed use","score":25},{"value":"land","label":"Land/new build","score":25}]},
  {"id":"q2","text":"What is your typical project size?","type":"select","options":[{"value":"small","label":"1–5 units","score":10},{"value":"medium","label":"6–20 units","score":25},{"value":"large","label":"21–50 units","score":35},{"value":"xlarge","label":"50+ units","score":40}]},
  {"id":"q3","text":"Do you have planning permission on current projects?","type":"select","options":[{"value":"yes","label":"Yes, ready to build","score":35},{"value":"applied","label":"Applied, pending","score":20},{"value":"pre_app","label":"Pre-application stage","score":10},{"value":"no","label":"Still sourcing land","score":5}]},
  {"id":"q4","text":"Are you looking for sales/lettings support on completed units?","type":"select","options":[{"value":"yes","label":"Yes, need sales agent","score":30},{"value":"lettings","label":"Yes, need lettings agent","score":25},{"value":"maybe","label":"Possibly","score":10},{"value":"no","label":"Have own team","score":0}]},
  {"id":"q5","text":"What regions are you active in?","type":"select","options":[{"value":"local","label":"Local area only","score":15},{"value":"regional","label":"Regional (multi-county)","score":25},{"value":"national","label":"National","score":35}]}
]$$,
'{"hot":75,"warm":45}',
'{"hot":"Hi [Name], this sounds like a brilliant opportunity. We have worked with developers on everything from marketing plans to full sales & lettings strategies — I would love to understand your project and see how we can support you. Can we get on a call this week?","warm":"Hi [Name], thanks for reaching out. We work with developers across the region and have a strong track record moving units quickly. Happy to have an exploratory chat to see how we can help.","cold":"Hi [Name], great to connect. When your next project is closer to completion, we would love to be your go-to for sales or lettings. Keep us in mind!"}',
'{"hot":"Schedule developer meeting within 48h, discuss sales/lettings strategy, request project brochure","warm":"Send developer case study, follow up in 7 days","cold":"Add to developer newsletter, check back in 90 days"}',
'["lead_type","status","company","notes","follow_up_date"]',
'["deal_value","deal_type","notes"]'),

-- 4. LETTING AGENT
('letting_agent', 'Letting Agent', 'Estate or letting agent looking for partnership or referral arrangement.',
$$[
  {"id":"q1","text":"What type of agency are you?","type":"select","options":[{"value":"independent","label":"Independent agency","score":25},{"value":"franchise","label":"Franchise/national brand","score":15},{"value":"online","label":"Online only","score":10},{"value":"hybrid","label":"Hybrid model","score":20}]},
  {"id":"q2","text":"How many managed properties are in your portfolio?","type":"select","options":[{"value":"under50","label":"Under 50","score":10},{"value":"50_200","label":"50–200","score":20},{"value":"200_500","label":"200–500","score":30},{"value":"500+","label":"500+","score":40}]},
  {"id":"q3","text":"Are you open to a referral partnership arrangement?","type":"select","options":[{"value":"yes","label":"Yes, actively looking","score":40},{"value":"maybe","label":"Open to discussing","score":20},{"value":"no","label":"Not currently","score":0}]},
  {"id":"q4","text":"What services are you looking for from us?","type":"select","options":[{"value":"maintenance","label":"Maintenance network","score":25},{"value":"overflow","label":"Overflow tenants/properties","score":20},{"value":"technology","label":"Technology/systems","score":15},{"value":"marketing","label":"Marketing support","score":15},{"value":"other","label":"Other","score":5}]},
  {"id":"q5","text":"Would you be interested in a white-label or co-brand approach?","type":"select","options":[{"value":"yes","label":"Yes, interested","score":20},{"value":"maybe","label":"Possibly","score":10},{"value":"no","label":"No preference","score":0}]}
]$$,
'{"hot":70,"warm":40}',
'{"hot":"Hi [Name], this sounds like a great potential partnership! We have worked with agencies like yours to create mutually beneficial referral arrangements that add real value for both sides. Can we arrange a proper introductory call to explore the details?","warm":"Hi [Name], thanks for reaching out. We are always open to building relationships with quality local agents — there could be some good synergies here. Would a brief call to explore options be worthwhile?","cold":"Hi [Name], good to connect. If your needs change or you want to explore a partnership in the future, please do get in touch — we are always open to collaborating with great agencies."}',
'{"hot":"Book partnership meeting within 48h, prepare referral fee structure and terms","warm":"Send partnership overview document, follow up in 5 days","cold":"Add to agent network list, follow up in 60 days"}',
'["lead_type","status","company","notes","follow_up_date"]',
'[]'),

-- 5. TENANT
('tenant', 'Tenant', 'Individual or family looking to rent a property.',
$$[
  {"id":"q1","text":"What type of property are you looking for?","type":"select","options":[{"value":"room","label":"Single room","score":5},{"value":"flat_1bed","label":"1-bed flat","score":10},{"value":"flat_2bed","label":"2-bed flat","score":15},{"value":"house","label":"House (any size)","score":20},{"value":"hmo","label":"HMO / house share","score":10}]},
  {"id":"q2","text":"What is your budget per month?","type":"select","options":[{"value":"under700","label":"Under £700","score":5},{"value":"700_1000","label":"£700–£1,000","score":10},{"value":"1000_1500","label":"£1,000–£1,500","score":20},{"value":"1500+","label":"£1,500+","score":30}]},
  {"id":"q3","text":"When do you need to move?","type":"select","options":[{"value":"now","label":"Immediately","score":30},{"value":"1month","label":"Within 1 month","score":25},{"value":"3months","label":"1–3 months","score":15},{"value":"flexible","label":"Flexible","score":5}]},
  {"id":"q4","text":"Do you have references and proof of income ready?","type":"select","options":[{"value":"yes","label":"Yes, all ready","score":30},{"value":"in_progress","label":"Getting them together","score":15},{"value":"no","label":"Not yet","score":0}]},
  {"id":"q5","text":"Are there any special requirements?","type":"select","options":[{"value":"pets","label":"Pets","score":0},{"value":"dss","label":"DSS/housing benefit","score":0},{"value":"none","label":"No special requirements","score":20},{"value":"guarantor","label":"Need guarantor","score":5}]}
]$$,
'{"hot":70,"warm":40}',
'{"hot":"Hi [Name], great news — we have some properties that could be perfect for you! You sound like exactly the kind of tenant our landlords love. Let me send you some options and we can arrange viewings this week — does that work for you?","warm":"Hi [Name], thanks for getting in touch! We have a few properties in your budget range. Can I ask a couple more questions to make sure we match you with the right place?","cold":"Hi [Name], thanks for enquiring. We will keep your details on file and let you know when something matching your requirements comes up. Feel free to browse our listings in the meantime."}',
'{"hot":"Send matching properties immediately, book viewings within 24h, request full tenant application","warm":"Send property options, request viewing availability","cold":"Add to tenant waiting list, send monthly property update"}',
'["lead_type","status","notes","follow_up_date"]',
'[]'),

-- 6. MAINTENANCE INQUIRY
('maintenance_inquiry', 'Maintenance Inquiry', 'Looking for property maintenance, refurbishment or repair services.',
$$[
  {"id":"q1","text":"What type of work do you need?","type":"select","options":[{"value":"full_refurb","label":"Full refurbishment","score":40},{"value":"partial","label":"Partial works (kitchen/bathroom)","score":25},{"value":"repairs","label":"General repairs/maintenance","score":15},{"value":"emergency","label":"Emergency repair","score":20},{"value":"compliance","label":"Compliance (EICR/gas/EPC)","score":20}]},
  {"id":"q2","text":"Is this for a residential or commercial property?","type":"select","options":[{"value":"residential_rented","label":"Rented residential","score":20},{"value":"residential_own","label":"Own home","score":15},{"value":"commercial","label":"Commercial","score":25},{"value":"portfolio","label":"Multiple properties","score":35}]},
  {"id":"q3","text":"What is your estimated budget?","type":"select","options":[{"value":"under5k","label":"Under £5k","score":5},{"value":"5_20k","label":"£5k–£20k","score":15},{"value":"20_50k","label":"£20k–£50k","score":25},{"value":"50k+","label":"£50k+","score":40}]},
  {"id":"q4","text":"How soon do you need the work done?","type":"select","options":[{"value":"urgent","label":"Urgent (within days)","score":30},{"value":"1month","label":"Within 1 month","score":20},{"value":"3months","label":"1–3 months","score":10},{"value":"flexible","label":"Flexible","score":5}]},
  {"id":"q5","text":"Have you worked with a maintenance company before?","type":"select","options":[{"value":"yes_bad","label":"Yes, had bad experience","score":20},{"value":"yes_ok","label":"Yes, looking for better","score":15},{"value":"no","label":"No, first time","score":10}]}
]$$,
'{"hot":70,"warm":40}',
'{"hot":"Hi [Name], this sounds like a great project for our team! We handle exactly this type of work and pride ourselves on quality, reliability and fair pricing. Can I get a few more details and arrange a site visit or video call to give you an accurate quote?","warm":"Hi [Name], thanks for getting in touch about [work type]. We have a great team for this and would love to put a quote together for you. When would be a good time to discuss the details?","cold":"Hi [Name], thanks for your enquiry. We cover a range of maintenance and refurbishment work. Feel free to send over more details and we can let you know if and when we can help."}',
'{"hot":"Call within 2h, arrange site visit within 48h, send quote within 3 days","warm":"Request more details, send quote within 5 days","cold":"Add to maintenance enquiry list, follow up in 14 days"}',
'["lead_type","status","notes","follow_up_date"]',
'["deal_value","deal_type","notes"]'),

-- 7. WEBSITE/APP PROSPECT
('website_app_prospect', 'Website / App Prospect', 'Business or individual wanting a website, web app or digital product built.',
$$[
  {"id":"q1","text":"What type of project are you looking to build?","type":"select","options":[{"value":"website","label":"Marketing website","score":15},{"value":"ecommerce","label":"E-commerce store","score":20},{"value":"webapp","label":"Web application/platform","score":35},{"value":"mobile","label":"Mobile app","score":35},{"value":"redesign","label":"Redesign existing site","score":20}]},
  {"id":"q2","text":"Do you have a budget in mind?","type":"select","options":[{"value":"under2k","label":"Under £2k","score":5},{"value":"2_5k","label":"£2k–£5k","score":10},{"value":"5_15k","label":"£5k–£15k","score":25},{"value":"15_50k","label":"£15k–£50k","score":35},{"value":"50k+","label":"£50k+","score":40}]},
  {"id":"q3","text":"Do you have a brief, design or wireframes ready?","type":"select","options":[{"value":"full","label":"Yes, full spec ready","score":30},{"value":"partial","label":"Partial — needs refining","score":20},{"value":"idea","label":"Just an idea","score":10}]},
  {"id":"q4","text":"What is your timeline?","type":"select","options":[{"value":"asap","label":"ASAP","score":25},{"value":"3months","label":"Within 3 months","score":20},{"value":"6months","label":"3–6 months","score":10},{"value":"flexible","label":"No fixed deadline","score":5}]},
  {"id":"q5","text":"Is this a new project or ongoing work?","type":"select","options":[{"value":"new","label":"New project","score":15},{"value":"ongoing","label":"Ongoing retainer wanted","score":30},{"value":"both","label":"New + potential ongoing","score":35}]}
]$$,
'{"hot":75,"warm":45}',
'{"hot":"Hi [Name], this project sounds right in our wheelhouse! We have built platforms and apps of exactly this type and I am confident we can deliver something great. Can we arrange a 30-minute discovery call to go through your vision and timeline?","warm":"Hi [Name], thanks for getting in touch. Your project sounds interesting and we have relevant experience to bring to it. I would love to learn more — are you free for a quick call to discuss?","cold":"Hi [Name], thanks for reaching out about your project. We work with clients at all stages and budgets. Send us more details and we will get back to you with our thoughts."}',
'{"hot":"Book discovery call within 24h, send portfolio and case studies, prepare scoping questions","warm":"Send portfolio, book exploratory call within 5 days","cold":"Send brochure, follow up in 14 days"}',
'["lead_type","status","company","notes","follow_up_date"]',
'["deal_value","deal_type","notes"]'),

-- 8. AI AUTOMATION PROSPECT
('ai_automation_prospect', 'AI Automation Prospect', 'Business looking to automate workflows, processes or customer interactions using AI.',
$$[
  {"id":"q1","text":"What area are you looking to automate?","type":"select","options":[{"value":"customer_service","label":"Customer service / chatbot","score":25},{"value":"lead_gen","label":"Lead generation","score":25},{"value":"admin","label":"Admin / back office","score":20},{"value":"marketing","label":"Marketing automation","score":20},{"value":"data","label":"Data processing / reporting","score":20},{"value":"full","label":"Multiple areas","score":35}]},
  {"id":"q2","text":"How many staff hours per week are currently spent on this task?","type":"select","options":[{"value":"under5","label":"Under 5 hours","score":5},{"value":"5_20","label":"5–20 hours","score":15},{"value":"20_40","label":"20–40 hours","score":25},{"value":"40+","label":"40+ hours","score":40}]},
  {"id":"q3","text":"What is your monthly budget for automation?","type":"select","options":[{"value":"under500","label":"Under £500","score":5},{"value":"500_2k","label":"£500–£2k","score":15},{"value":"2k_5k","label":"£2k–£5k","score":25},{"value":"5k+","label":"£5k+","score":40}]},
  {"id":"q4","text":"Have you tried AI tools before?","type":"select","options":[{"value":"yes_advanced","label":"Yes, using advanced tools","score":20},{"value":"yes_basic","label":"Yes, basic tools only","score":15},{"value":"no","label":"No, starting fresh","score":10}]},
  {"id":"q5","text":"What is your main goal from automation?","type":"select","options":[{"value":"cost_save","label":"Save money","score":15},{"value":"scale","label":"Scale without hiring","score":25},{"value":"speed","label":"Faster response times","score":20},{"value":"quality","label":"Improve quality/consistency","score":20},{"value":"all","label":"All of the above","score":30}]}
]$$,
'{"hot":75,"warm":45}',
'{"hot":"Hi [Name], this is exactly the kind of transformation we love helping businesses with! Automating [area] with AI can deliver serious ROI and we have the expertise to make it happen quickly and effectively. Can we book a discovery call to map out the opportunity?","warm":"Hi [Name], great to hear you are exploring AI automation — it is a real game-changer for businesses like yours. I would love to understand your current processes better and show you what is possible. Are you free for a 20-minute call?","cold":"Hi [Name], thanks for your interest in AI automation. It is a fast-moving space and the right solutions can make a big difference. When you are ready to explore further, we would love to help you figure out where to start."}',
'{"hot":"Book AI discovery call within 24h, send ROI calculator and case studies","warm":"Send AI automation overview, book call within 5 days","cold":"Add to AI newsletter, share one use-case article, follow up in 30 days"}',
'["lead_type","status","company","notes","follow_up_date"]',
'["deal_value","deal_type","notes"]'),

-- 9. SOURCER
('sourcer', 'Property Sourcer', 'Deal packager or sourcer looking to work together or pass deals.',
$$[
  {"id":"q1","text":"How many deals do you typically source per month?","type":"select","options":[{"value":"1_2","label":"1–2 deals","score":10},{"value":"3_5","label":"3–5 deals","score":20},{"value":"6_10","label":"6–10 deals","score":30},{"value":"10+","label":"10+ deals","score":40}]},
  {"id":"q2","text":"What types of deals do you specialise in?","type":"select","options":[{"value":"btl","label":"Buy-to-let","score":15},{"value":"hmo","label":"HMO","score":25},{"value":"sa","label":"Serviced accommodation","score":25},{"value":"flip","label":"Refurb/flip","score":20},{"value":"mixed","label":"Mixed portfolio","score":30}]},
  {"id":"q3","text":"Are you FCA regulated or authorised?","type":"select","options":[{"value":"yes","label":"Yes, fully authorised","score":30},{"value":"in_progress","label":"In the process","score":15},{"value":"no","label":"No","score":0}]},
  {"id":"q4","text":"What are you looking for from this partnership?","type":"select","options":[{"value":"buyers_list","label":"Access to our buyer list","score":30},{"value":"jv","label":"Joint venture opportunities","score":25},{"value":"management","label":"Management for sourced properties","score":20},{"value":"all","label":"All of the above","score":35}]},
  {"id":"q5","text":"Do you have a track record / completed deals to share?","type":"select","options":[{"value":"yes_many","label":"Yes, multiple case studies","score":20},{"value":"yes_some","label":"Yes, a few examples","score":10},{"value":"new","label":"New to sourcing","score":0}]}
]$$,
'{"hot":70,"warm":40}',
'{"hot":"Hi [Name], your sourcing operation sounds really impressive! We are always looking for reliable, quality sourcers to work with and there is a strong alignment here. Can we get on a call to discuss partnership terms and how we can make this work for both of us?","warm":"Hi [Name], great to connect. We work with a select group of sourcers and are open to exploring how we might work together. Can we have a call to understand your pipeline and what you are looking for?","cold":"Hi [Name], thanks for reaching out. Sourcing partnerships can work really well when the fit is right. Keep us posted on your deals and we can revisit when there is a clear opportunity."}',
'{"hot":"Book sourcer call within 48h, discuss deal flow and referral fee structure, request sample deal pack","warm":"Request deal examples, send partnership terms, follow up in 5 days","cold":"Add to sourcer list, follow up in 60 days"}',
'["lead_type","status","company","notes","follow_up_date"]',
'["deal_value","deal_type","expected_roi","notes"]'),

-- 10. SA OPERATOR
('sa_operator', 'SA Operator', 'Serviced accommodation operator looking for properties, management or tech.',
$$[
  {"id":"q1","text":"How many SA units do you currently operate?","type":"select","options":[{"value":"0","label":"None yet — just starting","score":5},{"value":"1_5","label":"1–5 units","score":15},{"value":"6_20","label":"6–20 units","score":30},{"value":"20+","label":"20+ units","score":40}]},
  {"id":"q2","text":"What model do you use?","type":"select","options":[{"value":"own","label":"Own properties","score":20},{"value":"r2sa","label":"Rent-to-SA (R2SA)","score":25},{"value":"management","label":"Management only","score":20},{"value":"mixed","label":"Mixed","score":30}]},
  {"id":"q3","text":"What is your main challenge right now?","type":"select","options":[{"value":"finding_units","label":"Finding new units/landlords","score":30},{"value":"occupancy","label":"Low occupancy","score":20},{"value":"operations","label":"Operational complexity","score":20},{"value":"pricing","label":"Pricing strategy","score":15},{"value":"tech","label":"Technology/automation","score":25}]},
  {"id":"q4","text":"What are you looking for from us?","type":"select","options":[{"value":"properties","label":"More properties to manage","score":30},{"value":"landlords","label":"Landlord introductions","score":30},{"value":"tech","label":"Tech/software support","score":20},{"value":"training","label":"Training or mentoring","score":15},{"value":"all","label":"Multiple things","score":35}]},
  {"id":"q5","text":"What platforms do you list on?","type":"select","options":[{"value":"airbnb_booking","label":"Airbnb + Booking.com","score":15},{"value":"direct_only","label":"Direct bookings mainly","score":20},{"value":"all","label":"All major OTAs","score":25},{"value":"none","label":"Not yet listed","score":0}]}
]$$,
'{"hot":70,"warm":40}',
'{"hot":"Hi [Name], your SA operation sounds like exactly the kind of business we love supporting! We have landlords and properties that would be perfect for R2SA, plus systems to help you scale operations smoothly. Can we arrange a call to explore how we can work together?","warm":"Hi [Name], great to connect! SA is a fantastic model and we work with operators across the region. I would love to understand your operation better and see where we can add value — are you free for a quick chat?","cold":"Hi [Name], thanks for reaching out. Serviced accommodation is a space we are really active in and there could be opportunities to collaborate as your business grows. Feel free to get back in touch when the time is right!"}',
'{"hot":"Book SA partnership call within 24h, discuss property sourcing and R2SA terms","warm":"Send SA partnership overview, follow up in 5 days","cold":"Add to SA operator list, share occupancy tips content, follow up in 45 days"}',
'["lead_type","status","company","notes","follow_up_date"]',
'["deal_value","deal_type","notes"]')

ON CONFLICT (lead_type) DO UPDATE SET
  label           = EXCLUDED.label,
  description     = EXCLUDED.description,
  questions       = EXCLUDED.questions,
  heat_thresholds = EXCLUDED.heat_thresholds,
  reply_templates = EXCLUDED.reply_templates,
  next_actions    = EXCLUDED.next_actions,
  crm_fields      = EXCLUDED.crm_fields,
  deal_fields     = EXCLUDED.deal_fields;
