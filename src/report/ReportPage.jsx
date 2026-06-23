import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import {
  answerByKey,
  extractPainPoints,
  pickAssets,
  prioritySort,
  stageFromScore
} from "../utils/reportUtils";

export default function ReportPage({ slug }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [features, setFeatures] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [featureMedia, setFeatureMedia] = useState([]);
  const [painMaster, setPainMaster] = useState([]);
  const [painMappings, setPainMappings] = useState([]);
  const [heroFeatures, setHeroFeatures] = useState([]);
  const [roadmapTemplates, setRoadmapTemplates] = useState([]);
  const [video, setVideo] = useState(null);
  const [featureModal, setFeatureModal] = useState(null);
  const [visibleFeatureCount, setVisibleFeatureCount] = useState(6);

  useEffect(() => {
    loadReport();
  }, [slug]);

  async function loadReport() {
    setLoading(true);
    setError("");

    let { data: sub, error: subError } = await supabase
      .from("submissions")
      .select("*, industries(id,name,slug)")
      .eq("report_slug", slug)
      .maybeSingle();

    if (!sub && !subError) {
      const byId = await supabase
        .from("submissions")
        .select("*, industries(id,name,slug)")
        .eq("id", slug)
        .maybeSingle();

      sub = byId.data;
      subError = byId.error;
    }

    if (subError) {
      setError(subError.message);
      setLoading(false);
      return;
    }

    if (!sub) {
      setError("Report not found.");
      setLoading(false);
      return;
    }

    const [
      ansRes,
      assetRes,
      featureRes,
      knowledgeRes,
      mediaRes,
      painMasterRes,
      painMapRes,
      roadmapRes,
      heroRes
    ] = await Promise.all([
      supabase
        .from("submission_answers")
        .select("*, questions(question_text, question_key)")
        .eq("submission_id", sub.id),

      supabase
        .from("report_assets")
        .select("*")
        .eq("industry_id", sub.industry_id)
        .eq("is_active", true)
        .order("priority", { ascending: false }),

      supabase
        .from("features_library")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false }),

      supabase
        .from("knowledge_items")
        .select("*, features_library(*), feature_use_cases(*)")
        .or(`industry_id.eq.${sub.industry_id},industry_id.is.null`)
        .eq("is_active", true)
        .order("priority", { ascending: false }),

      supabase
        .from("feature_media")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("pain_points_master")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false }),

      supabase
        .from("pain_point_feature_mapping")
        .select("*, features_library(*)")
        .eq("industry_id", sub.industry_id)
        .eq("is_active", true)
        .order("priority", { ascending: false }),

      supabase
        .from("roadmap_templates")
        .select("*")
        .eq("industry_id", sub.industry_id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("industry_hero_features")
        .select("*, features_library(*)")
        .eq("industry_id", sub.industry_id)
        .eq("is_active", true)
        .order("hero_score", { ascending: false })
    ]);

    setSubmission(sub);
    setAnswers(ansRes.data || []);
    setAssets(assetRes.data || []);
    setFeatures(featureRes.data || []);
    setKnowledge(knowledgeRes.data || []);
    setFeatureMedia(mediaRes.data || []);
    setPainMaster(painMasterRes.data || []);
    setPainMappings(painMapRes.data || []);
    setRoadmapTemplates(roadmapRes.data || []);
    setHeroFeatures(heroRes.data || []);
    setLoading(false);
  }

  const reportData = useMemo(() => {
    if (!submission) return null;

    const score = Number(submission.score_percentage || 0);
    const answerPainTexts = extractPainPoints(answers);
    const allAnswerText = collectAnswerText(answers);
    const detectedPainCodes = detectPainCodes(answerPainTexts, allAnswerText, painMaster);
    const detectedPainTitles = painMaster
      .filter((p) => detectedPainCodes.includes(p.code))
      .map((p) => p.title);

    const stage = submission.readiness_stage || stageFromScore(score);
    const stageSlug = stageToSlug(stage);

    const reality = buildReality({
      detectedPainCodes,
      detectedPainTitles,
      answerPainTexts,
      painMaster,
      knowledge,
      assets,
      score
    });

    const roadmap = buildRoadmap({
      roadmapTemplates,
      detectedPainCodes,
      stageSlug
    });

    const recommendedFeatures = buildRecommendedFeatures({
      painMappings,
      detectedPainCodes,
      features,
      knowledge,
      assets,
      score,
      heroFeatures,
      stageSlug
    });

    const demos = [
      ...knowledge
        .filter((k) => ["Demo Store", "Link"].includes(k.item_type))
        .map((k) => ({
          title: k.title,
          subtitle: k.category,
          description: k.content,
          external_url: k.external_link,
          logo_url: k.image_url,
          priority: k.priority
        })),
      ...pickAssets(assets, "demo_store", detectedPainTitles, score)
    ].sort(prioritySort).slice(0, 6);

    const cases = [
      ...knowledge
        .filter((k) => k.item_type === "Case Study")
        .map((k) => ({
          title: k.title,
          subtitle: k.category,
          description: k.content,
          external_url: k.external_link,
          priority: k.priority
        })),
      ...pickAssets(assets, "case_study", detectedPainTitles, score)
    ].sort(prioritySort).slice(0, 4);

    const testimonials = [
      ...knowledge
        .filter((k) => k.item_type === "Testimonial")
        .map((k) => ({
          title: k.title,
          subtitle: k.category,
          description: k.content,
          priority: k.priority
        })),
      ...pickAssets(assets, "testimonial", detectedPainTitles, score)
    ].sort(prioritySort).slice(0, 4);

    const cta =
      knowledge.find((k) => k.item_type === "CTA") ||
      assets.find((a) => a.asset_type === "cta") || {
        title: "Book a Free Onlin Demo",
        description: "Our team can show you how Onlin will work specifically for your business model, catalogue and customer flow.",
        external_url: "https://www.onlin.in/contact",
        cta_label: "Book Demo"
      };

    return {
      score,
      stage,
      detectedPainCodes,
      detectedPainTitles,
      roadmap,
      reality,
      recommendedFeatures,
      demos,
      cases,
      testimonials,
      cta
    };
  }, [submission, answers, assets, features, knowledge, featureMedia, painMaster, painMappings, roadmapTemplates, heroFeatures]);

  if (loading) return <div className="reportLoader">Loading report...</div>;
  if (error) return <div className="reportLoader">{error}</div>;
  if (!reportData) return <div className="reportLoader">No report found.</div>;

  const {
    score,
    stage,
    detectedPainTitles,
    roadmap,
    reality,
    recommendedFeatures,
    demos,
    cases,
    testimonials,
    cta
  } = reportData;

  return (
    <div className="reportPage">
      <div className="reportNav">
        <div className="brandMark">Onlin.in</div>
        <div className="reportTopActions">
          <a className="topDemoBtn" href="https://www.onlin.in/contact" target="_blank">Book Demo</a>
          <button type="button" onClick={() => window.print()}>Print Report</button>
        </div>
      </div>

      <a
        className="floatingWhatsapp"
        href={`https://wa.me/919703584448?text=${encodeURIComponent("Hello Onlin team, I want to book a demo.")}`}
        target="_blank"
        aria-label="WhatsApp"
      >
        ✆
      </a>

      <section className="reportHero">
        <div>
          <span>Business Diagnostic Report</span>
          <h1>{submission.business_name}</h1>
          <p>{submission.industries?.name} • Prepared for {submission.owner_name || "Business Owner"}</p>
        </div>
        <div className="bigScore">
          <b>{score}%</b>
          <span>Digital Readiness</span>
        </div>
      </section>

      <ReportSection number="01" title="Current Stage">
        <div className="stagePill">{stage}</div>
        <p>{submission.report_summary}</p>
      </ReportSection>

      <ReportSection number="02" title="Reality Check">
        <p className="sectionIntro">These are the gaps that may silently affect trust, conversion speed and repeat business.</p>
        <div className="reportGrid">
          {reality.map((item, i) => (
            <div className="insightCard danger" key={i}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.subtitle && <small>{item.subtitle}</small>}
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection number="03" title="Growth Roadmap">
        <p className="sectionIntro">A practical worklist based on detected gaps, stage and industry.</p>
        <div className="roadmapPhaseGrid">
          {groupByPhase(roadmap).map((group, idx) => (
            <div className="roadmapPhase" key={idx}>
              <span>{group.phase}</span>
              {group.items.map((r, i) => (
                <div className="roadmapTask" key={i}>
                  <b>{r.title}</b>
                  <p>{r.description}</p>
                  {r.expected_outcome && <small>Outcome: {r.expected_outcome}</small>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection number="04" title="How Onlin Helps">
        <p className="sectionIntro">Recommended features based on category, stage and detected pain areas.</p>
        <div className="featureGrid">
          {recommendedFeatures.slice(0, visibleFeatureCount).map((f, i) => (
            <div className="featureCard" key={i}>
              <span>{f.matched_pain_title || f.subtitle || "Onlin Feature"}</span>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
              <div className="cardActions linkStyleActions">
                <button type="button" onClick={() => setFeatureModal(f)}>View Feature</button>
                {f.video_url && (
                  <button type="button" onClick={() => setVideo({ title: f.title, video_url: f.video_url })}>
                    Watch Video
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="viewMoreWrap">
          {visibleFeatureCount < recommendedFeatures.length && (
            <button
              type="button"
              className="viewMoreBtn"
              onClick={() => setVisibleFeatureCount((count) => count + 6)}
            >
              View More
            </button>
          )}
          <a className="viewAllBtn" href="https://www.onlin.in/features" target="_blank">
            View All
          </a>
        </div>
      </ReportSection>

      <ReportSection number="05" title="Demo Stores">
        <div className="demoGrid">
          {demos.map((d, i) => (
            <a className="demoCard" key={i} href={d.external_url || "#"} target="_blank">
              <div className="demoLogo">{d.logo_url ? <img src={d.logo_url} /> : d.title?.charAt(0)}</div>
              <h3>{d.title}</h3>
              <p>{d.description}</p>
              <span>{d.cta_label || "Open Demo"} →</span>
            </a>
          ))}
        </div>
      </ReportSection>

      <ReportSection number="06" title="Case Studies">
        <div className="reportGrid">
          {cases.map((c, i) => (
            <div className="insightCard" key={i}>
              <small>{c.subtitle}</small>
              <h3>{c.title}</h3>
              <p>{c.description}</p>
              {c.external_url && <a href={c.external_url} target="_blank">Read More</a>}
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection number="07" title="Testimonials">
        <div className="testimonialGrid">
          {testimonials.map((t, i) => (
            <div className="testimonialCard" key={i}>
              <p>{t.description}</p>
              <b>{t.title}</b>
              <span>{t.subtitle}</span>
            </div>
          ))}
        </div>
      </ReportSection>

      <section className="reportCTA premiumBottomCta">
        <div className="trialBadge"><span></span> START FREE • NO CREDIT CARD</div>
        <h2>Ready to <em>start selling</em> online?</h2>
        <p>Join 500+ Indian businesses already growing with Onlin. Launch your store in minutes — zero transaction fees, every channel covered.</p>
        <div className="premiumCtaActions">
          <a className="startTrialBtn" href="https://www.onlin.in" target="_blank">Start free trial →</a>
          <a className="talkSalesBtn" href={`https://wa.me/919703584448?text=${encodeURIComponent("Hello Onlin team, I want to talk to sales.")}`} target="_blank">Talk to sales</a>
        </div>
        <div className="ctaStats">
          <div><b>500+</b><span>Active stores</span></div>
          <div><b>₹10Cr+</b><span>GMV processed</span></div>
          <div><b>4.9★</b><span>Customer rating</span></div>
        </div>
      </section>

      {featureModal && (
        <FeatureExperienceModal
          feature={featureModal}
          media={featureMedia.filter((m) => m.feature_id === featureModal.feature_id)}
          close={() => setFeatureModal(null)}
          openVideo={(v) => setVideo(v)}
        />
      )}

      {video && (
        <div className="videoModal">
          <div className="videoBox">
            <button type="button" onClick={() => setVideo(null)}>×</button>
            <h3>{video.title}</h3>
            <iframe src={toEmbed(video.video_url)} allowFullScreen></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

function buildRecommendedFeatures({
  painMappings,
  detectedPainCodes,
  features,
  knowledge,
  assets,
  score,
  heroFeatures,
  stageSlug
}) {
  const painCodeSet = new Set(detectedPainCodes);
  const featureScoreMap = new Map();

  function addFeature(item) {
    if (!item || !item.feature_id) return;
    const existing = featureScoreMap.get(item.feature_id);
    if (!existing || Number(item.priority || 0) > Number(existing.priority || 0)) {
      featureScoreMap.set(item.feature_id, item);
    }
  }

  painMappings
    .filter((m) => painCodeSet.has(m.pain_code))
    .forEach((m) => {
      const f = m.features_library || features.find((x) => x.id === m.feature_id);
      if (!f) return;
      addFeature({
        id: f.id,
        feature_id: f.id,
        title: f.name,
        subtitle: f.feature_category,
        description: m.recommendation_text || m.use_case_text || f.short_description,
        external_url: f.feature_link,
        video_url: f.video_url,
        priority: 1000 + Number(m.priority || 0) + Number(m.relevance_score || 0),
        matched_pain_title: m.pain_point || "Pain Match"
      });
    });


  // Star features: powerful platform features selected in admin
  features
    .filter((f) => f.is_star_feature)
    .forEach((f) => {
      addFeature({
        id: f.id,
        feature_id: f.id,
        title: f.name,
        subtitle: f.feature_category,
        description: f.short_description || "A high-impact Onlin feature useful for this business category.",
        external_url: f.feature_link,
        video_url: f.video_url,
        priority: 850 + Number(f.star_score || 0) + Number(f.priority || 0),
        matched_pain_title: "Star feature for your business"
      });
    });

  heroFeatures
    .filter((h) => !h.stage_slug || h.stage_slug === stageSlug)
    .forEach((h) => {
      const f = h.features_library || features.find((x) => x.id === h.feature_id);
      if (!f) return;
      addFeature({
        id: f.id,
        feature_id: f.id,
        title: f.name,
        subtitle: f.feature_category,
        description: h.use_case_text || h.hero_reason || f.short_description,
        external_url: f.feature_link,
        video_url: f.video_url,
        priority: 700 + Number(h.hero_score || 0),
        matched_pain_title: "Recommended for your industry"
      });
    });

  knowledge
    .filter((k) => ["Feature", "Report Recommendation", "Pain Point Solution"].includes(k.item_type))
    .filter((k) => k.feature_id)
    .forEach((k) => {
      const f = k.features_library || features.find((x) => x.id === k.feature_id);
      addFeature({
        id: k.id,
        feature_id: k.feature_id,
        title: f?.name || k.title,
        subtitle: f?.feature_category || k.item_type,
        description: k.content,
        external_url: k.external_link || f?.feature_link,
        video_url: k.video_url || f?.video_url,
        priority: 500 + Number(k.priority || 0),
        matched_pain_title: k.category || "Knowledge Match"
      });
    });

  let result = Array.from(featureScoreMap.values())
    .sort(prioritySort)
    .slice(0, 24);

  if (!result.length) {
    result = pickAssets(assets, "feature", [], score)
      .map((a) => ({
        id: a.id,
        feature_id: a.feature_id,
        title: a.title,
        subtitle: a.subtitle,
        description: a.description,
        external_url: a.external_url,
        video_url: a.video_url,
        priority: a.priority || 0,
        matched_pain_title: a.related_pain_point || "Recommended Feature"
      }))
      .slice(0, 6);
  }

  return result;
}

function buildRoadmap({ roadmapTemplates, detectedPainCodes, stageSlug }) {
  const painCodeSet = new Set(detectedPainCodes);

  let matches = roadmapTemplates
    .filter((r) => {
      const stageOk = !r.stage_slug || r.stage_slug === stageSlug;
      const painOk = !r.pain_code || painCodeSet.has(r.pain_code);
      return stageOk && painOk;
    })
    .sort((a, b) => {
      const aScore = Number(a.priority || 0) + (painCodeSet.has(a.pain_code) ? 100 : 0);
      const bScore = Number(b.priority || 0) + (painCodeSet.has(b.pain_code) ? 100 : 0);
      if (a.sort_order !== b.sort_order) return Number(a.sort_order || 0) - Number(b.sort_order || 0);
      return bScore - aScore;
    });

  matches = dedupeByTitle(matches.map((r) => ({
    title: r.task_title,
    subtitle: r.phase,
    description: r.task_description,
    expected_outcome: r.expected_outcome,
    priority: r.priority,
    sort_order: r.sort_order
  }))).slice(0, 9);

  return matches.length ? matches : defaultRoadmap();
}

function buildReality({ detectedPainCodes, detectedPainTitles, answerPainTexts, painMaster, knowledge, assets, score }) {
  const painCodeSet = new Set(detectedPainCodes);

  const fromMaster = painMaster
    .filter((p) => painCodeSet.has(p.code))
    .map((p) => ({
      title: p.title,
      description: p.description || "This issue can slow down sales, increase manual work and reduce trust.",
      subtitle: p.category,
      priority: p.priority
    }));

  const fromKnowledge = knowledge
    .filter((k) => ["Pain Point Solution", "Report Recommendation"].includes(k.item_type))
    .filter((k) => detectedPainTitles.includes(k.category) || answerPainTexts.includes(k.category))
    .map((k) => ({
      title: k.title,
      description: k.content,
      subtitle: k.category,
      priority: k.priority
    }));

  const result = dedupeByTitle([...fromKnowledge, ...fromMaster])
    .sort(prioritySort)
    .slice(0, 4);

  if (result.length) return result;

  const fallback = pickAssets(assets, "reality_check", answerPainTexts, score);
  return fallback.length ? fallback.slice(0, 4) : defaultReality(answerPainTexts);
}

function detectPainCodes(answerPainTexts, allAnswerText, painMaster) {
  const detected = new Set();
  const combinedText = normalizeText([...answerPainTexts, allAnswerText].join(" "));

  painMaster.forEach((p) => {
    const title = normalizeText(p.title);
    const code = p.code;

    if (title && combinedText.includes(title)) detected.add(code);

    (p.keywords || []).forEach((kw) => {
      const keyword = normalizeText(kw);
      if (keyword && combinedText.includes(keyword)) detected.add(code);
    });
  });

  return Array.from(detected);
}

function collectAnswerText(answers) {
  return answers
    .map((a) => {
      const selected = (a.selected_option_texts || []).join(" ");
      return `${a.answer_text || ""} ${selected}`;
    })
    .join(" ");
}

function FeatureExperienceModal({ feature, media, close, openVideo }) {
  const [index, setIndex] = useState(0);

  const slides = media.length
    ? media
    : [{
        media_type: "image",
        media_url: `https://placehold.co/1200x800/195FA6/FFFFFF?text=${encodeURIComponent(feature.title || "Feature")}`,
        caption: feature.title
      }];

  const current = slides[index];

  function prev() {
    setIndex((index - 1 + slides.length) % slides.length);
  }

  function next() {
    setIndex((index + 1) % slides.length);
  }

  return (
    <div className="featureModalBackdrop">
      <div className="featureModalBox">
        <button type="button" className="modalClose" onClick={close}>×</button>

        <div className="featureModalGrid">
          <div className="featureSlider">
            {current.media_type === "video" ? (
              <iframe src={toEmbed(current.media_url)} allowFullScreen></iframe>
            ) : (
              <img src={current.media_url} alt={current.caption || feature.title} />
            )}

            {slides.length > 1 && (
              <>
                <button type="button" className="sliderBtn left" onClick={prev}>‹</button>
                <button type="button" className="sliderBtn right" onClick={next}>›</button>
              </>
            )}

            <div className="sliderDots">
              {slides.map((_, i) => (
                <button
                  type="button"
                  key={i}
                  className={i === index ? "active" : ""}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </div>

          <div className="featureModalContent">
            <span>{feature.matched_pain_title || feature.subtitle || "Onlin Feature"}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>

            {current.caption && <div className="captionBox">{current.caption}</div>}

            <div className="featureBullets">
              <div>Reduces manual follow-up</div>
              <div>Improves customer clarity</div>
              <div>Builds a more professional buying journey</div>
            </div>

            <div className="cardActions">
              {feature.video_url && (
                <button type="button" onClick={() => openVideo({ title: feature.title, video_url: feature.video_url })}>
                  Watch Demo Video
                </button>
              )}
              {feature.external_url && (
                <a href={feature.external_url} target="_blank">
                  Explore Feature
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportSection({ number, title, children }) {
  return (
    <section className="reportSection">
      <span className="sectionNo">{number}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function stageToSlug(stage) {
  const text = normalizeText(stage);
  if (text.includes("manual")) return "manual";
  if (text.includes("under") || text.includes("structured")) return "under_structured";
  if (text.includes("growth")) return "growth_ready";
  if (text.includes("future")) return "future_ready";
  return text.replaceAll(" ", "_");
}

function normalizeText(text) {
  return String(text || "").trim().toLowerCase();
}

function groupByPhase(items) {
  const map = new Map();
  items.forEach((item) => {
    const phase = item.subtitle || item.phase || "Action Plan";
    if (!map.has(phase)) map.set(phase, []);
    map.get(phase).push(item);
  });

  return Array.from(map.entries()).map(([phase, items]) => ({ phase, items }));
}

function defaultReality(painPoints) {
  return (painPoints.length ? painPoints : ["Manual workflow", "Weak catalogue flow", "Low visibility"]).map((p) => ({
    title: p,
    description: "This gap can slow conversions, increase manual effort and reduce customer confidence."
  }));
}

function defaultRoadmap() {
  return [
    { subtitle: "First 30 Days", title: "Organize Product Photos", description: "Create clean product folders, naming rules and category-wise images." },
    { subtitle: "First 30 Days", title: "Create Product Categories", description: "Group products by type, collection, size, price range or occasion." },
    { subtitle: "Next 60 Days", title: "Build Digital Catalogue", description: "Create shareable product catalogues for customers and repeat buyers." },
    { subtitle: "Next 60 Days", title: "Collect Reviews", description: "Start collecting testimonials, product feedback and customer photos." },
    { subtitle: "Next 90 Days", title: "Launch Online Store", description: "Move from manual selling to a structured digital commerce journey." },
    { subtitle: "Next 90 Days", title: "Start Search Visibility", description: "Create pages that can be discovered beyond Instagram and WhatsApp." }
  ];
}

function dedupeByTitle(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item.title || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function industryPageUrl(slug) {
  if (!slug) return "https://www.onlin.in/industries/fashion";
  const map = {
    fashion: "https://www.onlin.in/industries/fashion",
    jewellery: "https://www.onlin.in/industries/jewellery",
    jewelry: "https://www.onlin.in/industries/jewellery",
    bakery: "https://www.onlin.in/industries/bakery"
  };
  return map[slug] || `https://www.onlin.in/industries/${slug}`;
}

function toEmbed(url) {
  if (!url) return "";
  if (url.includes("youtube.com/watch?v=")) return url.replace("watch?v=", "embed/");
  if (url.includes("youtu.be/")) return url.replace("youtu.be/", "www.youtube.com/embed/");
  return url;
}
