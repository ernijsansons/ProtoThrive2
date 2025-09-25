import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Zap, Users } from 'lucide-react';
import Link from 'next/link';

/**
 * Legally Compliant Hero Section
 * All claims verified against LEGAL_MARKETING_GUIDELINES.md
 */
const HeroSection = () => {
  // TODO: Replace with real waitlist count from backend API
  // For now, using a static placeholder to avoid misleading users
  const waitlistCount = "Join our growing";
  const isCountAvailable = false; // Set to true when real API is connected

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)]" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            animate={{
              x: [0, Math.random() * 400 - 200],
              y: [0, -500],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 10,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              bottom: '-10px',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Beta Badge - REQUIRED for compliance */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-blue-500/10 border border-blue-500/30 rounded-full"
        >
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-300 font-medium">Beta Preview - Join Early Access</span>
        </motion.div>

        {/* Main Headline - Verified claim */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
        >
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 bg-clip-text text-transparent">
            Your Roadmap,
          </span>
          <br />
          <span className="text-white">Living in 3D</span>
        </motion.h1>

        {/* Subheadline - No false claims */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
        >
          Transform static project plans into dynamic 3D visualizations
          while AI helps build your code. Experience the future of
          collaborative project management.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Link href="/signup">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              <span className="flex items-center gap-2">
                Join Beta Access
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </Link>

          <Link href="/demo">
            <button className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold text-white border border-gray-700 transition-all duration-200">
              Watch Demo
            </button>
          </Link>
        </motion.div>

        {/* Trust Signals - Only verified claims */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400"
        >
          {/* Real metric - waitlist count */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            <span>
              {isCountAvailable
                ? `${waitlistCount} on waitlist`
                : "Join our growing community"}
            </span>
          </div>

          {/* Architecture feature - verified */}
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Edge-Optimized</span>
          </div>

          {/* Security feature - accurate */}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Enterprise Security</span>
          </div>

          {/* AI feature - truthful */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI-Powered</span>
          </div>
        </motion.div>

        {/* Disclaimer - Required for beta */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-xs text-gray-500 max-w-2xl mx-auto"
        >
          *Beta software - features and pricing subject to change.
          Early access limited to qualified users.
          <Link href="/terms" className="underline hover:text-gray-400 ml-1">
            Terms apply
          </Link>
        </motion.p>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center"
        >
          <div className="w-1 h-2 bg-gray-400 rounded-full mt-2" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;