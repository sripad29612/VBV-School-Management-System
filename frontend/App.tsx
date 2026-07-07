import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, ImageBackground, ScrollView, Pressable, TextInput, ActivityIndicator, Dimensions, useWindowDimensions } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from './src/store';
import { logout } from './src/store/authSlice';
import { colors } from './src/theme/colors';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SchoolBuilding } from './src/components/SchoolBuilding';
import { StatusBar } from 'expo-status-bar';
import api from './src/services/api';
import {
  ArrowLeft, BookOpen, Layers, Image as ImageIcon, GraduationCap, PhoneCall, Award, Globe, Clock, MapPin, Eye,
  ShieldCheck, Heart, ChevronRight, ChevronLeft, Building2, Star, Shield, Users, UserCheck, Menu, X, Mail, Sparkles, Send, Calendar, Home
} from 'lucide-react-native';
const isWeb = typeof window !== 'undefined' && window.sessionStorage;
const hasVisitedSession = () => {
  if (isWeb) {
    try {
      return sessionStorage.getItem('hasVisited_vbv') === 'true';
    } catch (e) {
      return false;
    }
  }
  return false;
};
const setVisitedSession = () => {
  if (isWeb) {
    try {
      sessionStorage.setItem('hasVisited_vbv', 'true');
    } catch (e) {}
  }
};

const WelcomeIntroOverlay = ({ onFinish }: { onFinish: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 4 seconds total intro duration
    // Fade out begins at 3.5s and finishes at 4.0s (500ms transition)
    fadeTimerRef.current = setTimeout(() => {
      setFadeOut(true);
    }, 3500);

    finishTimerRef.current = setTimeout(() => {
      onFinish();
    }, 4000);

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  return (
    <View 
      {...{ className: fadeOut ? "welcome-intro-overlay welcome-intro-fadeout" : "welcome-intro-overlay" } as any}
      style={{
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0B1E4D',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <Text 
        {...{ className: "intro-word intro-welcome" } as any}
        style={{
          color: '#F5A623',
          fontSize: 26,
          fontWeight: '800',
          letterSpacing: 8,
          textAlign: 'center',
        }}
      >
        WELCOME TO
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginVertical: 20 }}>
        <Text 
          {...{ className: "intro-word intro-title-1" } as any}
          style={{
            color: '#ffffff',
            fontWeight: '900',
            letterSpacing: 2,
            lineHeight: 1.1,
            fontSize: 72,
          }}
        >
          VIDYA
        </Text>
        <Text 
          {...{ className: "intro-word intro-title-2" } as any}
          style={{
            color: '#ffffff',
            fontWeight: '900',
            letterSpacing: 2,
            lineHeight: 1.1,
            fontSize: 72,
          }}
        >
          BHARATHI
        </Text>
        <Text 
          {...{ className: "intro-word intro-title-3" } as any}
          style={{
            color: '#F5A623',
            fontWeight: '900',
            letterSpacing: 2,
            lineHeight: 1.1,
            fontSize: 72,
          }}
        >
          VIDYAPEETH
        </Text>
      </View>
      <Text 
        {...{ className: "intro-word intro-motto" } as any}
        style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: 3,
          marginTop: 10,
          textAlign: 'center',
        }}
      >
        Excellence • Discipline • Values
      </Text>
    </View>
  );
};


// Animated Counter Component for Statistics
const AnimatedCounter = ({ value, duration = 1500, label }: { value: number; duration?: number; label: string }) => {
  const [count, setCount] = useState(0);
  const containerRef = useRef<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      const el = containerRef.current;
      if (el) {
        observer.observe(el);
      } else {
        setVisible(true); // Fallback
      }
      return () => observer.disconnect();
    } else {
      setVisible(true); // Fallback for older browsers
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const end = value;
    if (start === end) return;

    const stepTime = Math.abs(Math.floor(duration / end));
    const timer = setInterval(() => {
      start += Math.ceil(end / 45); // Increment dynamically for smooth speed
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, Math.max(stepTime, 20));

    return () => clearInterval(timer);
  }, [value, duration, visible]);

  return (
    <View ref={containerRef} style={styles.statCard}>
      <Text style={styles.statNumber}>{count}+</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const HEADER_HEIGHT = 70;

const MainAppRouter = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, role: authRole } = useSelector((state: RootState) => state.auth);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [currentScreen, setCurrentScreen] = useState<'splash' | 'welcome-animation' | 'welcome' | 'login-selection' | 'login'>(
    isAuthenticated ? 'login' : 'welcome'
  );
  const [showIntro, setShowIntro] = useState(() => {
    if (isAuthenticated) return false;
    if (typeof window !== 'undefined') {
      try {
        return !sessionStorage.getItem('vbv_first_visit_intro');
      } catch (e) {
        return true;
      }
    }
    return true;
  });
  const [selectedRole, setSelectedRole] = useState<'student' | 'parent' | 'teacher' | 'principal' | 'admin' | undefined>(undefined);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Enquiry Form State
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [admissionClass, setAdmissionClass] = useState('Class I');
  const [locality, setLocality] = useState('');
  const [enqLoading, setEnqLoading] = useState(false);
  const [enqSubmitted, setEnqSubmitted] = useState(false);

  // Enquiry Form Smooth Open States
  const [enquiryFormVisible, setEnquiryFormVisible] = useState(true);
  const [hasClosedEnquiry, setHasClosedEnquiry] = useState(false);

  // Hero Auto-Play Slider State
  const [isPlaying, setIsPlaying] = useState(true);

  // Active section for navigation highlight
  const [activeSection, setActiveSection] = useState('home');

  // Screen width for responsive navigation
  const { width: windowWidth } = useWindowDimensions();

  // Scroll offset state for translucent navbar
  const [scrolled, setScrolled] = useState(false);

  // Admission Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const classesList = ['Nursery', 'LKG', 'UKG', 'Class I', 'Class II', 'Class III', 'Class IV', 'Class V', 'Class VI', 'Class VII'];

  // Auto-slide overrides & resume timers
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetAutoPlay = () => {
    setIsPlaying(false);
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      setIsPlaying(true);
    }, 5000); // Resume auto-sliding after exactly 5 seconds of inactivity
  };

  const handleManualSlideSelect = (index: number) => {
    setCurrentSlide(index);
    resetAutoPlay();
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
    resetAutoPlay();
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    resetAutoPlay();
  };

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      image: require('./assets/running_child.png'),
      title: 'Admissions Open for Academic Year 2026–27',
      subtitle: 'Learning • Discipline • Values • Excellence'
    },
    {
      image: require('./assets/play_area.png'),
      title: 'Smart Classrooms & Expert Mentorship',
      subtitle: 'Empowering children with analytics & digital smart systems'
    },
    {
      image: require('./assets/gardening_children.png'),
      title: 'Holistic Character & Environmental Growth',
      subtitle: 'Fostering responsibility, eco-consciousness & core ethics'
    },
    {
      image: require('./assets/vbv_campus.jpg'),
      title: 'State-of-the-Art Secure Digital Campus',
      subtitle: '24/7 camera snapshots, smart attendance & real-time school logs'
    }
  ];

  // Refs for scrolling to sections
  const scrollViewRef = useRef<ScrollView>(null);
  const [sectionLayouts, setSectionLayouts] = useState<Record<string, number>>({});

  const handleLayout = (name: string, y: number) => {
    setSectionLayouts(prev => ({ ...prev, [name]: y }));
  };

  const scrollToSection = (sectionName: string) => {
    setMobileMenuOpen(false);

    if (sectionName === 'enquiry-form') {
      setEnquiryFormVisible(true);
      setActiveSection('enquiry-form');
      
      const waitTime = sectionLayouts['enquiry-form'] === undefined ? 200 : 50;
      setTimeout(() => {
        const y = sectionLayouts['enquiry-form'];
        if (y !== undefined) {
          scrollViewRef.current?.scrollTo({ y: y - HEADER_HEIGHT, animated: true });
        }
      }, waitTime);
      return;
    }

    setActiveSection(sectionName);
    if (currentScreen !== 'welcome') {
      setCurrentScreen('welcome');
      // Wait a moment for rendering before scrolling
      setTimeout(() => {
        const y = sectionLayouts[sectionName];
        if (y !== undefined) {
          scrollViewRef.current?.scrollTo({ y: y - HEADER_HEIGHT, animated: true });
        }
      }, 100);
    } else {
      const y = sectionLayouts[sectionName];
      if (y !== undefined) {
        scrollViewRef.current?.scrollTo({ y: y - HEADER_HEIGHT, animated: true });
      }
    }
  };

  const handleScroll = (event: any) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setScrolled(yOffset > 50);
    let current = 'home';

    const sortedSections = [
      { name: 'home', y: sectionLayouts['home'] || 0 },
      { name: 'about', y: sectionLayouts['about'] || 9999 },
      { name: 'coaching', y: sectionLayouts['coaching'] || 9999 },
      { name: 'gallery', y: sectionLayouts['gallery'] || 9999 },
      { name: 'admissions', y: sectionLayouts['admissions'] || 9999 },
      { name: 'contact', y: sectionLayouts['contact'] || 9999 },
    ].sort((a, b) => a.y - b.y);

    for (const sec of sortedSections) {
      if (yOffset >= sec.y - 140) {
        current = sec.name;
      }
    }

    if (current === 'home') {
      if (activeSection === 'enquiry-form' && enquiryFormVisible) {
        current = 'enquiry-form';
      }
    }

    if (current !== activeSection) {
      setActiveSection(current);
    }
  };

  // Auto transition for slider (5-second intervals, pauses on manual click)
  useEffect(() => {
    if (currentScreen === 'welcome' && isPlaying) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentScreen, isPlaying]);

  // Cleanup auto-slide resume timer
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  // Sync screen state with authentication state (login/logout)
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentScreen('login');
    } else {
      setCurrentScreen('welcome');
    }
  }, [isAuthenticated]);


  // Smooth open enquiry form after 6 seconds if on welcome page
  useEffect(() => {
    if (currentScreen === 'welcome' && !hasClosedEnquiry && !enquiryFormVisible) {
      const timer = setTimeout(() => {
        setEnquiryFormVisible(true);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, hasClosedEnquiry]);

  // Handle Enquiry Submission
  const handleEnquirySubmit = async () => {
    if (enqLoading) return;
    
    if (!studentName.trim() || !parentName.trim() || !mobileNumber.trim() || !admissionClass.trim() || !locality.trim()) {
      alert('Please fill in all required fields (Student Name, Parent Name, Mobile Number, Locality).');
      return;
    }

    // Validate exactly 10 digit mobile number
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber.trim())) {
      alert('Please enter a valid 10-digit mobile number (e.g. 9948360000).');
      return;
    }

    try {
      setEnqLoading(true);
      await api.post('/enquiries/submit', {
        studentName: studentName.trim(),
        parentName: parentName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        admissionClass,
        locality: locality.trim()
      });
      alert('Success! Your Admission Enquiry has been submitted successfully.');
      setEnqSubmitted(true);
      setStudentName('');
      setParentName('');
      setMobileNumber('');
      setEmail('');
      setLocality('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setEnqLoading(false);
    }
  };

  // Handle Quick Contact Submission
  const handleContactSubmit = async () => {
    if (!contactName || !contactPhone || !contactMessage) {
      alert('Please fill in Name, Phone, and Message.');
      return;
    }
    try {
      setContactLoading(true);
      // For demo purposes, we will mock contact form API or use enquiries schema
      await new Promise(resolve => setTimeout(resolve, 800));
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  // Navigate to Login portal step
  const handleLoginPortalSelection = (roleSelection: 'student' | 'parent' | 'teacher' | 'principal' | 'admin') => {
    if (isAuthenticated && roleSelection !== authRole) {
      dispatch(logout());
    }
    setSelectedRole(roleSelection);
    setLoginModalVisible(false);
    setCurrentScreen('login');
  };

  if (currentScreen === 'splash') {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashContent}>
          <Image source={require('./assets/logo.jpg')} style={styles.splashLogo} />
          <Text style={styles.splashTitle}>VIDYA BHARATHI</Text>
          <Text style={styles.splashTitleSub}>VIDYAPEETH</Text>
          <View style={styles.splashBadgeContainer}>
            <Text style={styles.splashBadgeText}>ESTD 2012</Text>
          </View>
          <Text style={styles.splashMotto}>Learning · Discipline · Values · Excellence</Text>
          <SchoolBuilding width={260} height={120} style={{ marginTop: 40 }} />
        </View>
        <ActivityIndicator size="small" color="#F57C00" style={styles.spinner} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Injecting CSS for premium hovers & smooth animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,500;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

         /* Theme variables local to public web components */
         :root {
           --color-navy: #0B1E4D;
           --color-gold: #F5A623;
           --color-white: #FFFFFF;
           --color-light-gray: #F7F8FA;
           --color-border: #E5E7EB;
           --header-height: 70px;
         }

         /* Global Font Defaults for Web Elements */
         .logo-text, .headerSchoolName, .headerSchoolSub, .nav-link, .hero-anim-welcome, .hero-anim-word-1, .hero-anim-word-2, .hero-anim-word-3, .sectionBadge, .sectionMainTitle, .statNumber, .statLabel, .whyCardTitle, .whyCardDesc, .coachingCardClass, .coachingCardProgram, .coachingBulletText, .ctaTitle, .ctaSubtitle, .ctaBtnApplyText, .ctaBtnVisitText, .contactDetailLabel, .contactDetailText, .messageTitle, .messageSubmitText, .footerBrand, .footerAbout, .footerHeading, .footerLink, .footerContactInfo, .footerContactHighlight, .footerCopy, .hero-school-name, .hero-subtitle-dynamic {
           font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif !important;
         }

         .sectionMainTitle, .heroHeadline {
           font-family: 'Playfair Display', serif !important;
           font-weight: 700 !important;
         }

         /* GPU Accelerated Slide text animations */
         @keyframes wordReveal {
           0% {
             opacity: 0;
             transform: translateY(20px) translateZ(0);
             filter: blur(4px);
           }
           100% {
             opacity: 1;
             transform: translateY(0) translateZ(0);
             filter: blur(0);
           }
         }

         .hero-anim-welcome, .hero-anim-word-1, .hero-anim-word-2, .hero-anim-word-3, .hero-anim-estd, .hero-anim-headline, .hero-anim-tagline, .hero-anim-buttons {
           opacity: 0;
           transform: translateZ(0);
           animation: wordReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
         }
         .hero-anim-welcome { animation-delay: 0.1s; }
         .hero-anim-word-1 { animation-delay: 0.25s; }
         .hero-anim-word-2 { animation-delay: 0.35s; }
         .hero-anim-word-3 { animation-delay: 0.45s; }
         .hero-anim-estd { animation-delay: 0.6s; }
         .hero-anim-headline { animation-delay: 0.75s; }
         .hero-anim-tagline { animation-delay: 0.9s; }
         .hero-anim-buttons { animation-delay: 1.05s; }

         /* Dynamic Title & School Name font-sizes */
         .hero-school-name {
           font-size: 64px !important;
           line-height: 72px !important;
           font-weight: 900 !important;
         }
         .hero-title-dynamic {
           font-size: 28px !important;
           line-height: 36px !important;
           font-weight: 800 !important;
         }
         .hero-subtitle-dynamic {
           font-size: 16px !important;
           line-height: 24px !important;
           font-weight: 600 !important;
         }

        /* Nav links and actions */
        .nav-link {
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
          padding: 8px 12px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          cursor: pointer;
          position: relative;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 12px;
          right: 12px;
          height: 2px;
          background-color: var(--color-gold);
          transform: scaleX(0);
          transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          transform-origin: center;
        }
        .nav-link:hover::after,
        .nav-link.active::after {
          transform: scaleX(1);
        }
        .nav-link:hover {
          color: var(--color-gold);
          transform: translateY(-1px);
        }
        .login-btn-header {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          background-color: transparent !important;
          border-color: var(--color-gold) !important;
        }
        .login-btn-header:hover {
          background-color: var(--color-gold) !important;
          border-color: var(--color-gold) !important;
          box-shadow: 0 4px 14px rgba(245, 166, 35, 0.4);
          transform: translateY(-1px);
        }
        .btn-hover {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 166, 35, 0.35);
        }
        
        /* Premium Card hover lifts */
        .card-hover {
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(11, 30, 77, 0.08);
          border-color: rgba(245, 166, 35, 0.3) !important;
        }
        
        /* Dynamic Header blurring scroll state styles */
        .sticky-header-blur {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 4px 20px rgba(11, 30, 77, 0.15);
          background-color: rgba(11, 30, 77, 0.85) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }

        /* Welcome intro overlay */
        @keyframes introWordReveal {
          0% {
            opacity: 0;
            transform: translateY(20px) translateZ(0);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateZ(0);
            filter: blur(0);
          }
        }
        @keyframes introContainerFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; visibility: hidden; }
        }

        .welcome-intro-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--color-navy);
          z-index: 99999;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
          padding: 24px;
        }
        .welcome-intro-fadeout {
          animation: introContainerFadeOut 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .enquiry-close-btn-hover {
          transition: all 0.2s ease !important;
        }
        .enquiry-close-btn-hover:hover {
          background-color: #F8FAFC !important;
          transform: scale(1.05);
          border-color: #CBD5E1 !important;
        }
        .intro-word {
          display: inline-block;
          opacity: 0;
          transform: translateZ(0);
          animation: introWordReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .intro-welcome {
          color: var(--color-gold);
          font-size: 26px;
          font-weight: 800;
          letter-spacing: 8px;
          animation-delay: 0.1s;
        }
        .intro-title-1,
        .intro-title-2,
        .intro-title-3 {
          color: #ffffff;
          font-weight: 900;
          letter-spacing: 2px;
          line-height: 1.1;
          font-size: 72px;
        }
        .intro-title-1 {
          animation-delay: 0.6s;
        }
        .intro-title-2 {
          animation-delay: 0.9s;
        }
        .intro-title-3 {
          animation-delay: 1.2s;
          color: var(--color-gold) !important;
        }
        .intro-motto {
          color: rgba(255,255,255,0.6);
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 3px;
          animation-delay: 1.8s;
          margin-top: 10px;
        }

        /* Responsive layouts */
        @media (max-width: 1024px) {
          .intro-title-1,
          .intro-title-2,
          .intro-title-3 { font-size: 48px; }
          .intro-welcome { font-size: 20px; letter-spacing: 5px; }
          .intro-motto { font-size: 13px; }
        }

        /* Responsive Grid for Why Choose Us Cards */
        @media (min-width: 1025px) {
          .why-us-card-web {
            width: 23% !important;
          }
          .coaching-card-web {
            width: 31% !important;
          }
          .gallery-item-web {
            width: 23% !important;
          }
        }
        @media (max-width: 1024px) and (min-width: 768px) {
          .why-us-card-web {
            width: 47% !important;
          }
          .coaching-card-web {
            width: 47% !important;
          }
          .gallery-item-web {
            width: 47% !important;
          }
        }
        @media (max-width: 1024px) {
          .desktop-nav {
            display: none !important;
          }
          .hamburger-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
        }
        @media (min-width: 1025px) {
          .desktop-nav {
            display: flex !important;
          }
          .hamburger-btn {
            display: none !important;
          }
        }
        @media (max-width: 1180px) {
          .nav-link {
            font-size: 12px;
            padding: 6px 8px;
          }
        }

        /* Hero Responsive Overrides */
        @media (max-width: 1024px) {
          .hero-wrapper-web {
            height: auto !important;
            min-height: 100vh !important;
          }
          .hero-overlay-web {
            position: relative !important;
            height: auto !important;
            min-height: 100vh !important;
            padding: calc(var(--header-height) + 20px) 24px 60px 24px !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .hero-inner-container-web {
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
            gap: 30px !important;
          }
          .hero-left-web {
            width: 100% !important;
            align-items: center !important;
            text-align: center !important;
            margin-bottom: 20px !important;
          }
          .hero-right-web {
            width: 100% !important;
            max-width: 460px !important;
            min-width: 0 !important;
            margin-top: 10px !important;
          }
          .hero-buttons-web {
            justify-content: center !important;
          }
          .hero-school-name {
            font-size: 36px !important;
            line-height: 44px !important;
          }
          .hero-title-dynamic {
            font-size: 20px !important;
            line-height: 28px !important;
          }
          .hero-subtitle-dynamic {
            font-size: 14px !important;
            line-height: 20px !important;
          }
        }
 
        @media (max-width: 767px) {
          .hero-school-name {
            font-size: 28px !important;
            line-height: 36px !important;
          }
          .hero-title-dynamic {
            font-size: 18px !important;
            line-height: 24px !important;
          }
          .hero-subtitle-dynamic {
            font-size: 12px !important;
            line-height: 18px !important;
          }
        }
        .why-us-card-web {
            width: 100% !important;
          }
          .coaching-card-web {
            width: 100% !important;
          }
          .gallery-item-web {
            width: 100% !important;
          }
          .contact-grid-web {
            flex-direction: column !important;
          }
          .contact-detail-item-web {
            width: 100% !important;
          }
        }
      `}} />

      {showIntro && (
        <WelcomeIntroOverlay 
          onFinish={() => {
            sessionStorage.setItem('vbv_first_visit_intro', 'true');
            setShowIntro(false);
          }} 
        />
      )}
      <StatusBar style="light" />

      {/* ================= HEADER (STICKY) ================= */}
      {currentScreen === 'welcome' && (
        <View style={[
          styles.headerContainer,
          {
            backgroundColor: scrolled ? '#0B1E4D' : 'transparent',
            borderBottomColor: scrolled ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            backdropFilter: scrolled ? 'none' : 'blur(20px)',
            WebkitBackdropFilter: scrolled ? 'none' : 'blur(20px)',
            transition: 'background-color 0.3s ease, border-color 0.3s ease',
          } as any
        ]}>
          <Pressable onPress={() => setCurrentScreen('welcome')} style={styles.logoBlock}>
            <Image source={require('./assets/logo.jpg')} style={styles.headerLogo} />
            <View>
              <Text style={styles.headerSchoolName}>VIDYA BHARATHI</Text>
              <Text style={styles.headerSchoolSub}>VIDYAPEETH</Text>
            </View>
          </Pressable>

          {/* Desktop Navigation */}
          {windowWidth > 1024 && (
            <View {...{ className: "desktop-nav" } as any} style={styles.desktopNav}>
              <Text style={styles.navLink} onPress={() => scrollToSection('home')}>Home</Text>
              <Text style={styles.navLink} onPress={() => scrollToSection('about')}>About</Text>
              <Text style={styles.navLink} onPress={() => scrollToSection('coaching')}>Coaching</Text>
              <Text style={styles.navLink} onPress={() => scrollToSection('admissions')}>Admissions</Text>
              <Text style={styles.navLink} onPress={() => scrollToSection('gallery')}>Gallery</Text>
              <Text style={styles.navLink} onPress={() => scrollToSection('contact')}>Contact</Text>

              <Pressable 
                onPress={() => setCurrentScreen('login-selection')} 
                style={({ hovered }: any) => [
                  styles.loginBtnHeader,
                  hovered && { backgroundColor: '#F5A623', borderColor: '#F5A623' }
                ]}
              >
                {({ hovered }: any) => (
                  <Text style={[
                    styles.loginBtnText,
                    { color: hovered ? '#0B1E4D' : '#F5A623' }
                  ]}>
                    Login
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Mobile Nav Toggle */}
          {windowWidth <= 1024 && (
            <Pressable onPress={() => setMobileMenuOpen(!mobileMenuOpen)} {...{ className: "hamburger-btn" } as any} style={styles.hamburgerBtn}>
              {mobileMenuOpen ? <X size={24} color="#ffffff" /> : <Menu size={24} color="#ffffff" />}
            </Pressable>
          )}
        </View>
      )}

      {/* Mobile Menu Panel */}
      {currentScreen === 'welcome' && mobileMenuOpen && windowWidth <= 1024 && (
        <View style={[styles.mobileNavPanel, { backgroundColor: '#0B1E4D' }]}>
          <Pressable onPress={() => scrollToSection('home')} style={styles.mobileNavLink}>
            <Text style={[styles.mobileNavLinkText, activeSection === 'home' && styles.mobileActiveLinkText]}>Home</Text>
          </Pressable>
          <Pressable onPress={() => scrollToSection('about')} style={styles.mobileNavLink}>
            <Text style={[styles.mobileNavLinkText, activeSection === 'about' && styles.mobileActiveLinkText]}>About</Text>
          </Pressable>
          <Pressable onPress={() => scrollToSection('coaching')} style={styles.mobileNavLink}>
            <Text style={[styles.mobileNavLinkText, activeSection === 'coaching' && styles.mobileActiveLinkText]}>Coaching</Text>
          </Pressable>
          <Pressable onPress={() => scrollToSection('admissions')} style={styles.mobileNavLink}>
            <Text style={[styles.mobileNavLinkText, activeSection === 'admissions' && styles.mobileActiveLinkText]}>Admissions</Text>
          </Pressable>
          <Pressable onPress={() => scrollToSection('gallery')} style={styles.mobileNavLink}>
            <Text style={[styles.mobileNavLinkText, activeSection === 'gallery' && styles.mobileActiveLinkText]}>Gallery</Text>
          </Pressable>
          <Pressable onPress={() => scrollToSection('contact')} style={styles.mobileNavLink}>
            <Text style={[styles.mobileNavLinkText, activeSection === 'contact' && styles.mobileActiveLinkText]}>Contact</Text>
          </Pressable>
          
          <Pressable 
            onPress={() => { setMobileMenuOpen(false); setCurrentScreen('login-selection'); }} 
            style={({ hovered }: any) => [
              styles.mobileLoginBtn,
              hovered && { backgroundColor: '#F5A623', borderColor: '#F5A623' }
            ]}
          >
            {({ hovered }: any) => (
              <Text style={[
                styles.mobileLoginBtnText,
                { color: hovered ? '#0B1E4D' : '#ffffff' }
              ]}>
                Login
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {/* MAIN PUBLIC SCREEN / LANDING PAGE */}
      {currentScreen === 'welcome' && (
        <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={{ paddingTop: 0 }} onScroll={handleScroll} scrollEventThrottle={16}>
          <View 
            onLayout={(e) => handleLayout('home', e.nativeEvent.layout.y)} 
            {...{ className: "hero-wrapper-web" } as any}
            style={styles.heroWrapper}
          >
            
            <View 
              {...{
                onMouseEnter: () => setIsPlaying(false),
                onMouseLeave: () => setIsPlaying(true)
              } as any}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
              }}
            >
              {slides.map((slide, idx) => (
                <Image
                  key={idx}
                  source={slide.image}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    opacity: currentSlide === idx ? 1 : 0,
                    transition: 'opacity 1s ease-in-out',
                    resizeMode: 'cover',
                    objectFit: 'cover' as any,
                    objectPosition: 'center center' as any,
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                  } as any}
                />
              ))}
              <View style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: 'rgba(6, 15, 45, 0.58)',
                width: '100%',
                height: '100%',
              }} />
            </View>
 
            {/* Manual Navigation Arrows */}
            <Pressable onPress={handlePrevSlide} style={styles.sliderArrowLeft}>
              <ChevronLeft size={28} color="#ffffff" />
            </Pressable>
            <Pressable onPress={handleNextSlide} style={styles.sliderArrowRight}>
              <ChevronRight size={28} color="#ffffff" />
            </Pressable>
 
            {/* Slider Dots Indicator */}
            <View style={styles.sliderDotsContainer}>
              {slides.map((_, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleManualSlideSelect(idx)}
                  style={[
                    styles.sliderDot,
                    currentSlide === idx && styles.sliderDotActive
                  ]}
                />
              ))}
            </View>
 
            {/* Static Content Overlay */}
            <View {...{ className: "hero-overlay-web" } as any} style={styles.heroOverlay}>
              <View {...{ className: "hero-inner-container-web" } as any} style={styles.heroInnerContainer}>
                
                {/* Hero Left Content */}
                <View {...{ className: "hero-left-web" } as any} style={styles.heroLeft}>
                  {/* Hero Title Animation Block */}
                  <View style={{ marginBottom: 16, alignItems: 'flex-start' }}>
                    <Text {...{ className: "hero-anim-welcome" } as any} style={[styles.heroWelcome, { color: '#F5A623' }]}>WELCOME TO</Text>
                    <Text {...{ className: "hero-anim-word-1 hero-school-name" } as any} style={styles.heroTitle}>VIDYA BHARATHI</Text>
                    <Text {...{ className: "hero-anim-word-2 hero-school-name" } as any} style={styles.heroTitle}>VIDYAPEETH</Text>
                  </View>
 
                  {/* Remaining Hero Content with Fade-in Delays */}
                  <View {...{ className: "hero-anim-estd" } as any} style={styles.estdCapsule}>
                    <Text style={styles.estdText}>Established in 2012</Text>
                  </View>
                  
                  {/* Dynamic Slide Title & Subtitle block */}
                  <View style={{ minHeight: 120, justifyContent: 'center', alignSelf: 'stretch', marginBottom: 20 }}>
                    <View key={currentSlide} style={{ alignItems: 'flex-start', alignSelf: 'stretch' }}>
                      <Text {...{ className: "hero-anim-headline hero-title-dynamic" } as any} style={[styles.heroHeadline, { marginVertical: 0 }]}>
                        {slides[currentSlide].title}
                      </Text>
                      <Text {...{ className: "hero-anim-tagline hero-subtitle-dynamic" } as any} style={[styles.heroSubtitle, { marginTop: 8, marginBottom: 0 }]}>
                        {slides[currentSlide].subtitle}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Static Buttons block */}
                  <View {...{ className: "hero-anim-buttons hero-buttons-web" } as any} style={styles.heroButtons}>
                    <Pressable 
                      onPress={() => {
                        setEnquiryFormVisible(true);
                        scrollToSection('enquiry-form');
                      }} 
                      style={[styles.heroBtnApply, { backgroundColor: '#F5A623' }]}
                    >
                      <Text style={[styles.heroBtnText, { color: '#0B1E4D' }]}>
                        Apply
                      </Text>
                    </Pressable>
                    <Pressable 
                      onPress={() => scrollToSection('about')} 
                      style={[styles.heroBtnExplore, { borderColor: '#FFFFFF', borderWidth: 2 }]}
                    >
                      <Text style={[styles.heroBtnText, { color: '#ffffff' }]}>
                        Explore
                      </Text>
                    </Pressable>
                  </View>
                </View>
 
                {/* Hero Right: Admission Enquiry Form */}
                {enquiryFormVisible && (
                  <View 
                    onLayout={(e) => handleLayout('enquiry-form', e.nativeEvent.layout.y)} 
                    {...{ className: "hero-right-web" } as any}
                    style={styles.heroRight}
                  >
                    <View style={styles.enquiryCard}>
                      
                      {/* Close button in top-right (on all screen sizes) */}
                      <Pressable 
                        onPress={() => { setEnquiryFormVisible(false); setHasClosedEnquiry(true); }} 
                        {...{ className: "enquiry-close-btn-hover" } as any}
                        style={styles.enquiryCloseBtn}
                      >
                        <X size={14} color="#475569" />
                      </Pressable>

                      <View style={styles.enquiryCardHeader}>
                        <Sparkles size={16} color="#FF9F00" />
                        <Text style={styles.enquiryCardTitle}>Admission Enquiry 2026-27</Text>
                      </View>
                      
                      {!enqSubmitted ? (
                        <View style={styles.enquiryForm}>
                          <TextInput
                            style={styles.enqInput}
                            placeholder="Student Name *"
                            placeholderTextColor="#94A3B8"
                            value={studentName}
                            onChangeText={setStudentName}
                          />
                          <TextInput
                            style={styles.enqInput}
                            placeholder="Parent Name *"
                            placeholderTextColor="#94A3B8"
                            value={parentName}
                            onChangeText={setParentName}
                          />
                          <TextInput
                            style={styles.enqInput}
                            placeholder="Mobile Number *"
                            placeholderTextColor="#94A3B8"
                            keyboardType="phone-pad"
                            value={mobileNumber}
                            onChangeText={setMobileNumber}
                          />
                          <TextInput
                            style={styles.enqInput}
                            placeholder="Email Address"
                            placeholderTextColor="#94A3B8"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                          />
                          
                          <View style={{ marginBottom: 12, position: 'relative', zIndex: 120 }}>
                            <Text style={styles.selectLabel}>Admission For: *</Text>
                            <Pressable 
                              onPress={() => setDropdownOpen(!dropdownOpen)} 
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderWidth: 1.5,
                                borderColor: '#E2E8F0',
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                height: 44,
                                backgroundColor: '#F8FAFC',
                                cursor: 'pointer' as any,
                              }}
                            >
                              <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{admissionClass || 'Select Class...'}</Text>
                              <Text style={{ fontSize: 10, color: '#64748B' }}>{dropdownOpen ? '▲' : '▼'}</Text>
                            </Pressable>

                            {dropdownOpen && (
                              <View style={{
                                position: 'absolute',
                                top: 68,
                                left: 0,
                                right: 0,
                                backgroundColor: '#ffffff',
                                borderRadius: 12,
                                borderWidth: 1.5,
                                borderColor: '#E2E8F0',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                                elevation: 5,
                                zIndex: 200,
                                maxHeight: 200,
                                overflow: 'hidden',
                              }}>
                                <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true}>
                                  {classesList.map((c) => (
                                    <Pressable
                                      key={c}
                                      onPress={() => {
                                        setAdmissionClass(c);
                                        setDropdownOpen(false);
                                      }}
                                      style={{
                                        paddingVertical: 10,
                                        paddingHorizontal: 16,
                                        backgroundColor: admissionClass === c ? '#F1F5F9' : '#ffffff',
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#F1F5F9',
                                        cursor: 'pointer' as any,
                                      }}
                                    >
                                      <Text style={{
                                        fontSize: 13,
                                        color: admissionClass === c ? '#F57C00' : '#1E293B',
                                        fontWeight: admissionClass === c ? '700' : '500',
                                      }}>{c}</Text>
                                    </Pressable>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                          </View>

                          <TextInput
                            style={styles.enqInput}
                            placeholder="Locality / Village *"
                            placeholderTextColor="#94A3B8"
                            value={locality}
                            onChangeText={setLocality}
                          />

                          <Pressable
                            onPress={handleEnquirySubmit}
                            style={[styles.enqSubmitBtn, { backgroundColor: '#F57C00' }]}
                            disabled={enqLoading}
                          >
                            {enqLoading ? (
                              <ActivityIndicator color="#ffffff" />
                            ) : (
                              <Text style={styles.enqSubmitBtnText}>Apply Now</Text>
                            )}
                          </Pressable>
                        </View>
                      ) : (
                        <View style={styles.enquirySuccess}>
                          <View style={styles.successIconCircle}>
                            <ShieldCheck size={40} color="#198754" />
                          </View>
                          <Text style={styles.successTitle}>Enquiry Submitted!</Text>
                          <Text style={styles.successText}>
                            Thank you for interest in Vidya Bharathi Vidyapeeth. Our admissions desk will review your details and contact you shortly.
                          </Text>
                          <Pressable onPress={() => setEnqSubmitted(false)} style={styles.resetEnquiryBtn}>
                            <Text style={styles.resetEnquiryText}>Submit Another Enquiry</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                )}

              </View>
            </View>
          </View>

          {/* ================= STATISTICS SECTION ================= */}
          <View style={styles.statsSection}>
            <View style={styles.statsContainer}>
              <AnimatedCounter value={15} label="Years of Excellence" />
              <AnimatedCounter value={450} label="Enrolled Students" />
              <AnimatedCounter value={30} label="Expert Faculty" />
              <AnimatedCounter value={100} label="Awards & Honors" />
            </View>
          </View>

          {/* ================= ABOUT / WHY CHOOSE US SECTION ================= */}
          <View onLayout={(e) => handleLayout('about', e.nativeEvent.layout.y)} style={styles.aboutSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBadge}>ABOUT US</Text>
              <Text style={styles.sectionMainTitle}>Why Choose Vidya Bharathi Vidyapeeth?</Text>
              <Text style={styles.sectionSubtitle}>
                Dedicated to nurturing young minds since 2012 with a perfect blend of modern academic coaching and core moral guidelines.
              </Text>
            </View>

            {/* Why Choose Us Grid - 8 Premium Cards */}
            <View style={styles.whyUsGrid}>
              {[
                { title: 'Experienced Faculty', desc: 'Highly trained professionals focusing on foundation building and standard practices.', icon: UserCheck, color: '#0B5ED7' },
                { title: 'Smart Learning Environment', desc: 'Audio-visual classes and technology integrated into daily studies.', icon: Layers, color: '#F57C00' },
                { title: 'Holistic Development', desc: 'Equally highlighting sports, arts, environmental values, and logic studies.', icon: Sparkles, color: '#198754' },
                { title: 'Safe & Secure Campus', desc: '24/7 CCTV surveillance cameras with real-time snapshots available to parents.', icon: ShieldCheck, color: '#6F42C1' },
                { title: 'Value-Based Education', desc: 'Fostering deep integrity, discipline, respect, and environmental consciousness.', icon: Heart, color: '#DC3545' },
                { title: 'Individual Student Attention', desc: 'Maintaining ideal teacher-student ratios for customized guidance.', icon: Users, color: '#0DCAF0' },
                { title: 'Hostel Facility', desc: 'Safe accommodation, healthy nutritious food, and structured study supervision.', icon: Home, color: '#FF9F00' },
                { title: 'Transport Facility', desc: 'Safe school buses covering multiple pickup points with active student safety tracking.', icon: MapPin, color: '#17A2B8' }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <View key={index} {...{ className: "why-us-card-web card-hover" } as any} style={styles.whyUsCard}>
                    <View style={[styles.whyIconCircle, { backgroundColor: item.color + '20' }]}>
                      <Icon size={24} color={item.color} />
                    </View>
                    <Text style={styles.whyCardTitle}>{item.title}</Text>
                    <Text style={styles.whyCardDesc}>{item.desc}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ================= ACADEMIC COACHING SECTION ================= */}
          <View onLayout={(e) => handleLayout('coaching', e.nativeEvent.layout.y)} style={styles.coachingSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBadge}>COACHING PORTAL</Text>
              <Text style={styles.sectionMainTitle}>Special Academic Coaching Programs</Text>
              <Text style={styles.sectionSubtitle}>
                Equipping students for prestigious school entrances and technical foundations from early classes.
              </Text>
            </View>

            <View style={styles.coachingGrid}>
              
              {/* Class IV */}
              <View {...{ className: "coaching-card-web card-hover" } as any} style={styles.coachingCard}>
                <View style={[styles.coachingCardHeader, { backgroundColor: '#F5A623' }]}>
                  <Text style={styles.coachingCardClass}>Class IV</Text>
                  <Text style={styles.coachingCardProgram}>Gurukula Entrance Prep</Text>
                </View>
                <View style={styles.coachingCardBody}>
                  <View style={styles.coachingBullet}><Award size={14} color="#F57C00" /><Text style={styles.coachingBulletText}>Foundation Building</Text></View>
                  <View style={styles.coachingBullet}><Award size={14} color="#F57C00" /><Text style={styles.coachingBulletText}>Subject Mastery (Languages & EVS)</Text></View>
                  <View style={styles.coachingBullet}><Award size={14} color="#F57C00" /><Text style={styles.coachingBulletText}>Practice Mock Tests</Text></View>
                </View>
              </View>

              {/* Class V */}
              <View {...{ className: "coaching-card-web card-hover" } as any} style={styles.coachingCard}>
                <View style={[styles.coachingCardHeader, { backgroundColor: '#198754' }]}>
                  <Text style={styles.coachingCardClass}>Class V</Text>
                  <Text style={styles.coachingCardProgram}>Navodaya & Sainik Prep</Text>
                </View>
                <View style={styles.coachingCardBody}>
                  <View style={styles.coachingBullet}><Award size={14} color="#198754" /><Text style={styles.coachingBulletText}>Quantitative Aptitude</Text></View>
                  <View style={styles.coachingBullet}><Award size={14} color="#198754" /><Text style={styles.coachingBulletText}>Logical & Mental Reasoning</Text></View>
                  <View style={styles.coachingBullet}><Award size={14} color="#198754" /><Text style={styles.coachingBulletText}>Interview & Health Guidance</Text></View>
                </View>
              </View>

              {/* Class VI & VII */}
              <View {...{ className: "coaching-card-web card-hover" } as any} style={styles.coachingCard}>
                <View style={[styles.coachingCardHeader, { backgroundColor: '#0B1E4D' }]}>
                  <Text style={styles.coachingCardClass}>Classes VI & VII</Text>
                  <Text style={styles.coachingCardProgram}>IIT Foundation</Text>
                </View>
                <View style={styles.coachingCardBody}>
                  <View style={styles.coachingBullet}><Award size={14} color="#0B5ED7" /><Text style={styles.coachingBulletText}>Advanced Mathematics & Logic</Text></View>
                  <View style={styles.coachingBullet}><Award size={14} color="#0B5ED7" /><Text style={styles.coachingBulletText}>Physics & Chemistry Concepts</Text></View>
                  <View style={styles.coachingBullet}><Award size={14} color="#0B5ED7" /><Text style={styles.coachingBulletText}>Olympiad & Competitive Exam Drill</Text></View>
                </View>
              </View>

            </View>
          </View>

          {/* ================= GALLERY SECTION ================= */}
          <View onLayout={(e) => handleLayout('gallery', e.nativeEvent.layout.y)} style={styles.gallerySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBadge}>CAMPUS LIFE</Text>
              <Text style={styles.sectionMainTitle}>Photo Gallery</Text>
              <Text style={styles.sectionSubtitle}>
                A glance into our campus activities, science exhibitions, celebrations, and garden planting programs.
              </Text>
            </View>

            <View style={styles.galleryGrid}>
              <View {...{ className: "gallery-item-web card-hover" } as any} style={styles.galleryGridItem}>
                <Image source={require('./assets/running_child.png')} style={styles.galleryImg} />
                <View style={styles.galleryImgOverlay}><Text style={styles.galleryImgTitle}>Sports Day activities</Text></View>
              </View>
              <View {...{ className: "gallery-item-web card-hover" } as any} style={styles.galleryGridItem}>
                <Image source={require('./assets/play_area.png')} style={styles.galleryImg} />
                <View style={styles.galleryImgOverlay}><Text style={styles.galleryImgTitle}>Classroom play-blocks</Text></View>
              </View>
              <View {...{ className: "gallery-item-web card-hover" } as any} style={styles.galleryGridItem}>
                <Image source={require('./assets/gardening_children.png')} style={styles.galleryImg} />
                <View style={styles.galleryImgOverlay}><Text style={styles.galleryImgTitle}>Gardening sapling project</Text></View>
              </View>
              <View {...{ className: "gallery-item-web card-hover" } as any} style={styles.galleryGridItem}>
                <Image source={require('./assets/vbv_campus.jpg')} style={styles.galleryImg} />
                <View style={styles.galleryImgOverlay}><Text style={styles.galleryImgTitle}>Lush green playground</Text></View>
              </View>
            </View>

            <Pressable onPress={() => alert('Viewing complete gallery folder.')} style={[styles.viewFullGalleryBtn, { borderColor: '#0B1E4D' }]}>
              <Text style={[styles.viewFullGalleryText, { color: '#0B1E4D' }]}>View Full Gallery</Text>
            </Pressable>
          </View>

          {/* ================= ADMISSIONS CTA BANNER ================= */}
          <View onLayout={(e) => handleLayout('admissions', e.nativeEvent.layout.y)} style={styles.ctaBanner}>
            <Text style={styles.ctaTitle}>Admissions Open for Session 2026-27</Text>
            <Text style={styles.ctaSubtitle}>Seats are limited for Nursery to Class VII. Secure your child's seat today.</Text>
            <View style={styles.ctaButtons}>
              <Pressable onPress={() => { setEnquiryFormVisible(true); scrollToSection('enquiry-form'); }} style={[styles.ctaBtnApply, { backgroundColor: '#F5A623' }]}>
                <Text style={styles.ctaBtnApplyText}>Apply Now</Text>
              </Pressable>
              <Pressable onPress={() => scrollToSection('contact')} style={styles.ctaBtnVisit}>
                <Text style={styles.ctaBtnVisitText}>Schedule Campus Visit</Text>
              </Pressable>
            </View>
          </View>

          {/* ================= CONTACT SECTION ================= */}
          <View onLayout={(e) => handleLayout('contact', e.nativeEvent.layout.y)} style={styles.contactSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBadge}>GET IN TOUCH</Text>
              <Text style={styles.sectionMainTitle}>Contact Information</Text>
            </View>

            <View {...{ className: "contact-grid-web" } as any} style={styles.contactGrid}>
              
              {/* Map & Addresses */}
              <View style={styles.contactLeft}>
                <View style={styles.mapMock}>
                  <MapPin size={32} color="#DC3545" />
                  <Text style={styles.mapTitle}>VIDYA BHARATHI VIDYAPEETH</Text>
                  <Text style={styles.mapText}>Palsi Village, Mandal: Kubeer, District: Nirmal, Telangana</Text>
                  <Text style={styles.mapSub}>PIN: 504103</Text>
                </View>

                <View style={styles.contactDetails}>
                  <View {...{ className: "contact-detail-item-web" } as any} style={styles.contactDetailItem}>
                    <MapPin size={18} color="#0B1E4D" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.contactDetailLabel}>Location</Text>
                      <Text style={styles.contactDetailText}>Palsi, Kubeer Mandal, Nirmal Dist, TS.</Text>
                    </View>
                  </View>

                  <View {...{ className: "contact-detail-item-web" } as any} style={styles.contactDetailItem}>
                    <PhoneCall size={18} color="#198754" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.contactDetailLabel}>Call Us</Text>
                      <Text style={styles.contactDetailText}>+91 99483 70709, +91 99483 69209</Text>
                    </View>
                  </View>

                  <View {...{ className: "contact-detail-item-web" } as any} style={styles.contactDetailItem}>
                    <Mail size={18} color="#F5A623" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.contactDetailLabel}>Email</Text>
                      <Text style={styles.contactDetailText}>info@vbvschool.edu.in</Text>
                    </View>
                  </View>

                  <View {...{ className: "contact-detail-item-web" } as any} style={styles.contactDetailItem}>
                    <Clock size={18} color="#6F42C1" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.contactDetailLabel}>Office Hours</Text>
                      <Text style={styles.contactDetailText}>Mon - Sat: 8:30 AM - 4:00 PM</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Message Form */}
              <View style={styles.contactRight}>
                <View style={styles.messageCard}>
                  <Text style={styles.messageTitle}>Send a Quick Message</Text>
                  
                  {!contactSuccess ? (
                    <View style={styles.messageForm}>
                      <TextInput
                        style={styles.messageInput}
                        placeholder="Your Name *"
                        placeholderTextColor="#94A3B8"
                        value={contactName}
                        onChangeText={setContactName}
                      />
                      <TextInput
                        style={styles.messageInput}
                        placeholder="Phone Number *"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        value={contactPhone}
                        onChangeText={setContactPhone}
                      />
                      <TextInput
                        style={styles.messageInput}
                        placeholder="Email Address"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        value={contactEmail}
                        onChangeText={setContactEmail}
                      />
                      <TextInput
                        style={[styles.messageInput, { height: 100, textAlignVertical: 'top' }]}
                        placeholder="Your Message *"
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={4}
                        value={contactMessage}
                        onChangeText={setContactMessage}
                      />

                      <Pressable
                        onPress={handleContactSubmit}
                        style={[styles.messageSubmitBtn, { backgroundColor: '#0B5ED7' }]}
                        disabled={contactLoading}
                      >
                        {contactLoading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Send size={14} color="#ffffff" />
                            <Text style={styles.messageSubmitText}>Send Message</Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.messageSuccess}>
                      <ShieldCheck size={36} color="#198754" />
                      <Text style={styles.msgSuccessTitle}>Message Sent!</Text>
                      <Text style={styles.msgSuccessText}>Thank you for contacting us. We will revert back shortly.</Text>
                      <Pressable onPress={() => setContactSuccess(false)} style={styles.msgSuccessBtn}>
                        <Text style={styles.msgSuccessBtnText}>Send Another Message</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>

            </View>
          </View>

          {/* ================= FOOTER ================= */}
          <View style={[styles.footer, { backgroundColor: '#0B1E4D' }]}>
            <View style={styles.footerContainer}>
              
              <View style={styles.footerCol}>
                <Text style={styles.footerBrand}>VIDYA BHARATHI VIDYAPEETH</Text>
                <Text style={styles.footerAbout}>
                  A premium institution establishing quality character, standard logic coaching, and environment awareness for young children. Founded in 2012.
                </Text>
              </View>

              <View style={styles.footerCol}>
                <Text style={styles.footerHeading}>Quick Links</Text>
                <Pressable onPress={() => scrollToSection('home')}><Text style={styles.footerLink}>Home</Text></Pressable>
                <Pressable onPress={() => scrollToSection('about')}><Text style={styles.footerLink}>About Us</Text></Pressable>
                <Pressable onPress={() => scrollToSection('coaching')}><Text style={styles.footerLink}>Coaching</Text></Pressable>
                <Pressable onPress={() => scrollToSection('admissions')}><Text style={styles.footerLink}>Admissions</Text></Pressable>
                <Pressable onPress={() => scrollToSection('gallery')}><Text style={styles.footerLink}>Gallery</Text></Pressable>
              </View>

              <View style={styles.footerCol}>
                <Text style={styles.footerHeading}>Admissions</Text>
                <Text style={styles.footerContactInfo}>Classes: Nursery to VII</Text>
                <Text style={styles.footerContactInfo}>Session: 2026-2027</Text>
                <Text style={styles.footerContactInfo}>Admission Hotline:</Text>
                <Text style={styles.footerContactHighlight}>+91 99483 70709</Text>
              </View>

            </View>

            <View style={styles.footerBottom}>
              <Text style={styles.footerCopy}>
                © {new Date().getFullYear()} Vidya Bharathi Vidyapeeth. All Rights Reserved.
              </Text>
            </View>
          </View>

        </ScrollView>
      )}

      {/* RENDER LOGIN PORTAL IN SCREEN WORKSPACE */}
      {currentScreen === 'login' && (
        <View style={{ flex: 1 }}>
          {isAuthenticated ? (
            <DashboardScreen />
          ) : (
            <View style={{ flex: 1 }}>
              <View style={[styles.loginScreenHeader, { backgroundColor: '#0B1E4D' }]}>
                <Pressable onPress={() => setCurrentScreen('login-selection')} style={styles.loginBackBtn}>
                  <ArrowLeft size={18} color="#ffffff" />
                  <Text style={styles.loginBackBtnText}>Back to Portals</Text>
                </Pressable>
                <Text style={styles.loginScreenTitle}>VBV DIGITAL CAMPUS</Text>
              </View>
              <LoginScreen initialRole={selectedRole} initialStep="input" />
            </View>
          )}
        </View>
      )}

      {/* RENDER LOGIN SELECTION PORTAL */}
      {currentScreen === 'login-selection' && (
        <View style={{ flex: 1, backgroundColor: '#0B1E4D', justifyContent: 'center', alignItems: 'center' }}>
          <View style={[styles.loginScreenHeader, { backgroundColor: '#0B1E4D', width: '100%', position: 'absolute', top: 0, left: 0 }]}>
            <Pressable onPress={() => setCurrentScreen('welcome')} style={styles.loginBackBtn}>
              <ArrowLeft size={18} color="#ffffff" />
              <Text style={styles.loginBackBtnText}>Back to Home</Text>
            </Pressable>
            <Text style={styles.loginScreenTitle}>VBV DIGITAL CAMPUS</Text>
          </View>
          
          <View style={[styles.modalContent, { marginTop: 80, width: Dimensions.get('window').width > 480 ? 450 : '90%', alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Portal Login</Text>
            </View>
            <Text style={styles.modalSub}>Select the portal you want to sign in with:</Text>
            <View style={styles.portalGrid}>
              {[
                { label: 'Student Portal', role: 'student', icon: GraduationCap, color: '#0B5ED7' },
                { label: 'Parent Portal', role: 'parent', icon: Users, color: '#F57C00' },
                { label: 'Teacher Portal', role: 'teacher', icon: UserCheck, color: '#198754' },
                { label: 'Principal Portal', role: 'principal', icon: Shield, color: '#6F42C1' }
              ].map((portal, idx) => {
                const Icon = portal.icon;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleLoginPortalSelection(portal.role as any)}
                    style={[styles.portalBtn, { borderLeftColor: portal.color }]}
                  >
                    <View style={[styles.portalIconCircle, { backgroundColor: portal.color + '15' }]}>
                      <Icon size={20} color={portal.color} />
                    </View>
                    <Text style={styles.portalBtnText}>{portal.label}</Text>
                    <ChevronRight size={16} color="#64748B" style={{ marginLeft: 'auto' }} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

    </View>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <MainAppRouter />
    </Provider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0B1E4D',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  splashLogo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#ffffff',
    marginBottom: 24,
  },
  splashTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  splashTitleSub: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: -2,
  },
  splashBadgeContainer: {
    backgroundColor: '#F5A623',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  splashBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  splashMotto: {
    color: '#FFE8CC',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 14,
    fontWeight: '700',
  },
  spinner: {
    marginTop: 20,
  },

  // Header Sticky Styles
  headerContainer: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer' as any,
  },
  headerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  headerSchoolName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSchoolSub: {
    color: '#F5A623',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: -1,
  },
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navLink: {
    color: '#ffffff',
    fontWeight: '700' as any,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    cursor: 'pointer' as any,
  },
  enquiryBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  loginBtnHeader: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F5A623',
    cursor: 'pointer' as any,
  },
  loginBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  hamburgerBtn: {
    cursor: 'pointer' as any,
    padding: 4,
  },

  // Mobile Menu Styles
  mobileNavPanel: {
    position: 'fixed' as any,
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#0B1E4D',
    paddingVertical: 20,
    paddingHorizontal: 24,
    zIndex: 999,
    borderBottomWidth: 2,
    borderBottomColor: '#F5A623',
  },
  mobileNavLink: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  mobileNavLinkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  mobileActiveLinkText: {
    color: '#F5A623',
  },
  mobileLoginBtn: {
    marginTop: 16,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F5A623',
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    backgroundColor: 'transparent',
  },
  mobileLoginBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },

  scrollView: {
    flex: 1,
  },

  // Hero Section
  heroWrapper: {
    width: '100%',
    height: '100svh' as any,
    minHeight: '100vh' as any,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#060f2d',
  },
  heroBackground: {
    width: '100%',
    height: '100svh' as any,
    minHeight: '100vh' as any,
  },
  heroOverlay: {
    position: 'absolute' as any,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 15, 45, 0.58)',
    paddingTop: HEADER_HEIGHT + 20,
    paddingBottom: 40,
    paddingHorizontal: 60,
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  heroInnerContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 40,
  },
  heroLeft: {
    width: '55%',
    minWidth: 320,
  },
  heroRight: {
    width: '40%',
    maxWidth: 460,
    minWidth: 380,
  },
  heroWelcome: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 72,
    letterSpacing: 0.5,
  },
  estdCapsule: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  estdText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  heroHeadline: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 12,
  },
  heroSubtitle: {
    color: '#FFD8A8',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '700',
    marginBottom: 28,
  },
  heroButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  heroBtnApply: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    cursor: 'pointer' as any,
  },
  heroBtnExplore: {
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
    cursor: 'pointer' as any,
  },
  heroBtnText: {
    fontWeight: '900',
    fontSize: 14,
  },

  // Enquiry Card Right Panel
  heroRight: {
    width: 400,
    maxWidth: '100%',
  },
  enquiryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#0B1E4D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    position: 'relative',
  },
  enquiryCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    cursor: 'pointer' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  enquiryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 16,
  },
  enquiryCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1E4D',
  },
  enquiryForm: {
    gap: 12,
  },
  enqInput: {
    height: 40,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  selectClassRow: {
    marginVertical: 4,
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
  },
  classPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  classPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  classPillActive: {
    backgroundColor: '#0B5ED7',
    borderColor: '#0B5ED7',
  },
  classPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  classPillTextActive: {
    color: '#ffffff',
  },
  enqSubmitBtn: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    cursor: 'pointer' as any,
  },
  enqSubmitBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  enquirySuccess: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1E7DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F5132',
    marginBottom: 8,
  },
  successText: {
    fontSize: 13,
    color: '#0F5132',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  resetEnquiryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#198754',
  },
  resetEnquiryText: {
    color: '#198754',
    fontSize: 12,
    fontWeight: '800',
  },

  // Stats Section
  statsSection: {
    backgroundColor: '#0B1E4D',
    paddingVertical: 28,
    borderBottomWidth: 4,
    borderBottomColor: '#F5A623',
  },
  statsContainer: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    gap: 20,
  },
  statCard: {
    alignItems: 'center',
    minWidth: 180,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F5A623',
  },
  statLabel: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },

  // Section Headers
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 40,
    maxWidth: 700,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F5A623',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionMainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0B1E4D',
    textAlign: 'center',
    lineHeight: 34,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },

  // About Section
  aboutSection: {
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
  },
  whyUsGrid: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 24,
  },
  whyUsCard: {
    width: '31%',
    minWidth: 280,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 24,
    cursor: 'pointer' as any,
  },
  whyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  whyCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1E4D',
    marginBottom: 8,
  },
  whyCardDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },

  // Coaching Section
  coachingSection: {
    paddingVertical: 60,
    backgroundColor: '#F8FAFC',
  },
  coachingGrid: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 24,
  },
  coachingCard: {
    width: '31%',
    minWidth: 280,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    cursor: 'pointer' as any,
  },
  coachingCardHeader: {
    backgroundColor: '#F5A623',
    padding: 20,
    alignItems: 'center',
  },
  coachingCardClass: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  coachingCardProgram: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  coachingCardBody: {
    padding: 20,
    gap: 14,
  },
  coachingBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coachingBulletText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  // Gallery Section
  gallerySection: {
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
  },
  galleryGrid: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 30,
  },
  galleryGridItem: {
    width: '23%',
    minWidth: 240,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryImgOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5, 12, 45, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  galleryImgTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  viewFullGalleryBtn: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#0B5ED7',
    cursor: 'pointer' as any,
  },
  viewFullGalleryText: {
    color: '#0B5ED7',
    fontWeight: '800',
    fontSize: 13,
  },

  // Admissions CTA Banner
  ctaBanner: {
    backgroundColor: '#0B1E4D',
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#FFD8A8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  ctaButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  ctaBtnApply: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    cursor: 'pointer' as any,
  },
  ctaBtnApplyText: {
    color: '#0B1E4D',
    fontWeight: '900',
    fontSize: 14,
  },
  ctaBtnVisit: {
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
    cursor: 'pointer' as any,
  },
  ctaBtnVisitText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },

  // Contact Section
  contactSection: {
    paddingVertical: 60,
    backgroundColor: '#FFFDF9', // Cream Background
  },
  contactGrid: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 30,
  },
  contactLeft: {
    flex: 1.2,
    minWidth: 320,
    gap: 20,
  },
  mapMock: {
    height: 180,
    backgroundColor: '#cbd5e1',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  mapTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0B1E4D',
    marginTop: 8,
  },
  mapText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  mapSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '700',
  },
  contactDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  contactDetailItem: {
    width: '47%',
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  contactDetailLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  contactDetailText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },

  // Contact Right - Message Form
  contactRight: {
    flex: 1,
    minWidth: 320,
  },
  messageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1E4D',
    marginBottom: 16,
  },
  messageForm: {
    gap: 12,
  },
  messageInput: {
    height: 40,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  messageSubmitBtn: {
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    cursor: 'pointer' as any,
  },
  messageSubmitText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },
  messageSuccess: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  msgSuccessTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F5132',
    marginTop: 12,
    marginBottom: 6,
  },
  msgSuccessText: {
    fontSize: 12,
    color: '#0F5132',
    textAlign: 'center',
    marginBottom: 20,
  },
  msgSuccessBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#198754',
  },
  msgSuccessBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  // Footer Section
  footer: {
    paddingTop: 60,
    paddingBottom: 24,
    borderTopWidth: 4,
    borderTopColor: '#F57C00',
  },
  footerContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 30,
    marginBottom: 40,
  },
  footerCol: {
    flex: 1,
    minWidth: 260,
  },
  footerBrand: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  footerAbout: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  footerHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FF9F00',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  footerLink: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 10,
    cursor: 'pointer' as any,
  },
  footerContactInfo: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  footerContactHighlight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF9F00',
    marginTop: 4,
  },
  footerBottom: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 20,
    alignItems: 'center',
  },
  footerCopy: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Login Screen Header Inside Router
  loginScreenHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  loginBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginBackBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  loginScreenTitle: {
    color: '#FF9F00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Modal Login Portal Popup
  modalOverlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 12, 45, 0.72)',
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B1E4D',
  },
  modalCloseBtn: {
    padding: 4,
    cursor: 'pointer' as any,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 18,
  },
  portalGrid: {
    gap: 10,
  },
  portalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderLeftWidth: 5,
    cursor: 'pointer' as any,
  },
  portalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  portalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  sliderArrowLeft: {
    position: 'absolute',
    left: 20,
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(5, 12, 45, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
    cursor: 'pointer' as any,
  },
  sliderArrowRight: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(5, 12, 45, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
    cursor: 'pointer' as any,
  },
  sliderDotsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 90,
  },
  sliderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer' as any,
  },
  sliderDotActive: {
    width: 24,
    backgroundColor: '#FF9F00',
  },
});
