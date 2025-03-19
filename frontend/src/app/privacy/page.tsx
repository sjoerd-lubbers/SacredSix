"use client"

import Link from 'next/link'
import { APP_NAME } from '@/config'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground mb-6">
              Last updated: March 18, 2025
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p>
                {APP_NAME} ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our productivity application and website (collectively, the "Service").
              </p>
              <p>
                Please read this Privacy Policy carefully. By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              <p>
                We collect information that you provide directly to us when you:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Create an account</li>
                <li>Use the features of our Service</li>
                <li>Contact customer support</li>
                <li>Participate in surveys or promotions</li>
              </ul>
              
              <p>
                This information may include:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Personal identifiers (name, email address)</li>
                <li>Account credentials</li>
                <li>User-generated content (projects, tasks, notes)</li>
                <li>Usage data and preferences</li>
              </ul>
              
              <p>
                We also automatically collect certain information when you use our Service, including:
              </p>
              <ul className="list-disc pl-6">
                <li>Device information (type, operating system, browser)</li>
                <li>IP address and location data</li>
                <li>Usage statistics and interactions</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process and complete transactions</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Understand how users interact with our Service</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Protect against harmful or illegal activity</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Sharing and Disclosure</h2>
              <p>
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6">
                <li>With your consent or at your direction</li>
                <li>With service providers who perform services on our behalf</li>
                <li>To comply with legal obligations</li>
                <li>To protect the rights, property, or safety of our users or others</li>
                <li>In connection with a business transfer or transaction</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6">
                <li>Accessing, correcting, or deleting your personal information</li>
                <li>Objecting to or restricting certain processing activities</li>
                <li>Data portability</li>
                <li>Withdrawing consent</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the information provided at the end of this Privacy Policy.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
              <p>
                Our Service is not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>
 
          </div>
        </div>
      </div>
    </div>
  )
}
