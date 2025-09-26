#!/usr/bin/env python3
"""
ProtoThrive Frontend Audit Script
Author: Senior UI/UX Engineer & SDET
Date: September 25, 2025
Target: https://protothrive-frontend.pages.dev
"""

import json
import os
import time
from datetime import datetime
from pathlib import Path
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import re

# Audit configuration
SITE_URL = "https://protothrive-frontend.pages.dev"
AUDIT_TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M%S")
BASE_DIR = Path(f"/home/claude/audit-workspace/audit-runs/{AUDIT_TIMESTAMP}")

# Create directory structure
directories = [
    'screenshots', 'console', 'har', 'lighthouse', 
    'coverage', 'reports', 'tests/playwright'
]
for dir_name in directories:
    (BASE_DIR / dir_name).mkdir(parents=True, exist_ok=True)

class ProtoThriveAuditor:
    def __init__(self):
        self.issues = []
        self.component_inventory = {}
        self.design_tokens = {}
        self.interaction_map = []
        self.performance_metrics = {}
        self.accessibility_issues = []
        self.seo_issues = []
        self.security_issues = []
        
    def setup_driver(self):
        """Configure Chrome driver with optimal settings for testing"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        chrome_options.add_argument('--window-size=1920,1080')
        
        # Enable performance logging
        chrome_options.set_capability('goog:loggingPrefs', {
            'browser': 'ALL',
            'performance': 'ALL'
        })
        
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            return driver
        except Exception as e:
            print(f"Error setting up driver: {e}")
            return None
    
    def capture_initial_state(self, driver):
        """Capture initial page state and metadata"""
        try:
            driver.get(SITE_URL)
            time.sleep(5)  # Allow page to load
            
            # Capture screenshot
            screenshot_path = BASE_DIR / 'screenshots' / 'homepage_initial.png'
            driver.save_screenshot(str(screenshot_path))
            
            # Get page source
            page_source = driver.page_source
            with open(BASE_DIR / 'reports' / 'homepage_source.html', 'w') as f:
                f.write(page_source)
            
            # Collect console logs
            console_logs = driver.get_log('browser')
            with open(BASE_DIR / 'console' / 'initial_logs.json', 'w') as f:
                json.dump(console_logs, f, indent=2)
            
            # Check page title and meta tags
            title = driver.title
            meta_tags = driver.find_elements(By.TAG_NAME, 'meta')
            
            return {
                'url': driver.current_url,
                'title': title,
                'meta_count': len(meta_tags),
                'console_errors': len([log for log in console_logs if log['level'] == 'SEVERE'])
            }
        except Exception as e:
            self.log_issue('INIT-001', 'P0', 'functional', f'Failed to load initial page: {e}')
            return None
    
    def analyze_components(self, driver):
        """Identify and inventory all UI components"""
        components = {
            'buttons': [],
            'inputs': [],
            'links': [],
            'modals': [],
            'forms': [],
            'images': [],
            'videos': [],
            'navigation': []
        }
        
        try:
            # Find all interactive elements
            buttons = driver.find_elements(By.TAG_NAME, 'button')
            links = driver.find_elements(By.TAG_NAME, 'a')
            inputs = driver.find_elements(By.TAG_NAME, 'input')
            forms = driver.find_elements(By.TAG_NAME, 'form')
            
            # Catalog components
            for button in buttons:
                try:
                    components['buttons'].append({
                        'text': button.text,
                        'class': button.get_attribute('class'),
                        'id': button.get_attribute('id'),
                        'aria_label': button.get_attribute('aria-label'),
                        'disabled': button.get_attribute('disabled'),
                        'visible': button.is_displayed()
                    })
                except:
                    pass
            
            for link in links:
                try:
                    components['links'].append({
                        'text': link.text,
                        'href': link.get_attribute('href'),
                        'target': link.get_attribute('target'),
                        'visible': link.is_displayed()
                    })
                except:
                    pass
            
            self.component_inventory = components
            return components
            
        except Exception as e:
            self.log_issue('COMP-001', 'P1', 'analysis', f'Component analysis failed: {e}')
            return components
    
    def test_interactions(self, driver):
        """Test all interactive elements"""
        interaction_results = []
        
        try:
            # Test all buttons
            buttons = driver.find_elements(By.TAG_NAME, 'button')
            for i, button in enumerate(buttons):
                try:
                    if button.is_displayed() and button.is_enabled():
                        # Capture before state
                        driver.save_screenshot(str(BASE_DIR / 'screenshots' / f'button_{i}_before.png'))
                        
                        # Click button
                        driver.execute_script("arguments[0].scrollIntoView(true);", button)
                        time.sleep(0.5)
                        button.click()
                        time.sleep(1)
                        
                        # Capture after state
                        driver.save_screenshot(str(BASE_DIR / 'screenshots' / f'button_{i}_after.png'))
                        
                        interaction_results.append({
                            'element': 'button',
                            'index': i,
                            'text': button.text,
                            'success': True
                        })
                except Exception as e:
                    interaction_results.append({
                        'element': 'button',
                        'index': i,
                        'error': str(e),
                        'success': False
                    })
                    
        except Exception as e:
            self.log_issue('INT-001', 'P0', 'functional', f'Interaction testing failed: {e}')
        
        self.interaction_map = interaction_results
        return interaction_results
    
    def check_accessibility(self, driver):
        """Run accessibility checks"""
        a11y_issues = []
        
        try:
            # Check for alt text on images
            images = driver.find_elements(By.TAG_NAME, 'img')
            for img in images:
                if not img.get_attribute('alt'):
                    a11y_issues.append({
                        'type': 'missing_alt_text',
                        'element': 'img',
                        'src': img.get_attribute('src'),
                        'severity': 'P0'
                    })
            
            # Check for form labels
            inputs = driver.find_elements(By.TAG_NAME, 'input')
            for input_elem in inputs:
                input_id = input_elem.get_attribute('id')
                if input_id:
                    labels = driver.find_elements(By.CSS_SELECTOR, f'label[for="{input_id}"]')
                    if not labels:
                        a11y_issues.append({
                            'type': 'missing_label',
                            'element': 'input',
                            'id': input_id,
                            'severity': 'P0'
                        })
            
            # Check heading hierarchy
            headings = driver.find_elements(By.CSS_SELECTOR, 'h1, h2, h3, h4, h5, h6')
            prev_level = 0
            for heading in headings:
                level = int(heading.tag_name[1])
                if level - prev_level > 1:
                    a11y_issues.append({
                        'type': 'heading_skip',
                        'from_level': prev_level,
                        'to_level': level,
                        'text': heading.text[:50],
                        'severity': 'P1'
                    })
                prev_level = level
            
            # Check for ARIA attributes
            interactive_elements = driver.find_elements(By.CSS_SELECTOR, 'button, a, input, select, textarea')
            for elem in interactive_elements:
                if elem.tag_name == 'button' and not elem.text and not elem.get_attribute('aria-label'):
                    a11y_issues.append({
                        'type': 'missing_aria_label',
                        'element': elem.tag_name,
                        'severity': 'P0'
                    })
            
        except Exception as e:
            self.log_issue('A11Y-001', 'P0', 'accessibility', f'Accessibility check failed: {e}')
        
        self.accessibility_issues = a11y_issues
        return a11y_issues
    
    def check_responsive_design(self, driver):
        """Test responsive design at different viewports"""
        viewports = [
            (320, 640, 'mobile_small'),
            (390, 844, 'mobile_medium'),
            (768, 1024, 'tablet'),
            (1024, 1366, 'laptop'),
            (1920, 1080, 'desktop')
        ]
        
        responsive_issues = []
        
        for width, height, device_name in viewports:
            try:
                driver.set_window_size(width, height)
                driver.refresh()
                time.sleep(2)
                
                # Take screenshot
                driver.save_screenshot(str(BASE_DIR / 'screenshots' / f'responsive_{device_name}.png'))
                
                # Check for horizontal scroll
                body = driver.find_element(By.TAG_NAME, 'body')
                if driver.execute_script("return document.body.scrollWidth > window.innerWidth"):
                    responsive_issues.append({
                        'viewport': f'{width}x{height}',
                        'issue': 'horizontal_scroll',
                        'severity': 'P1'
                    })
                
                # Check for overlapping elements
                elements = driver.find_elements(By.CSS_SELECTOR, '*')
                for elem in elements[:50]:  # Check first 50 elements for performance
                    try:
                        if elem.is_displayed():
                            rect = elem.rect
                            if rect['width'] > width:
                                responsive_issues.append({
                                    'viewport': f'{width}x{height}',
                                    'issue': 'element_overflow',
                                    'element': elem.tag_name,
                                    'severity': 'P1'
                                })
                    except:
                        pass
                        
            except Exception as e:
                self.log_issue('RESP-001', 'P1', 'responsive', f'Responsive test failed at {width}x{height}: {e}')
        
        return responsive_issues
    
    def analyze_performance(self, driver):
        """Analyze performance metrics"""
        perf_metrics = {}
        
        try:
            # Get performance timing
            performance_timing = driver.execute_script("return window.performance.timing")
            
            # Calculate metrics
            perf_metrics = {
                'page_load_time': performance_timing['loadEventEnd'] - performance_timing['navigationStart'],
                'dom_content_loaded': performance_timing['domContentLoadedEventEnd'] - performance_timing['navigationStart'],
                'time_to_first_byte': performance_timing['responseStart'] - performance_timing['navigationStart'],
                'dom_interactive': performance_timing['domInteractive'] - performance_timing['navigationStart']
            }
            
            # Get resource timing
            resources = driver.execute_script("return window.performance.getEntriesByType('resource')")
            
            # Analyze resources
            resource_summary = {
                'total_resources': len(resources),
                'js_files': len([r for r in resources if 'javascript' in r.get('initiatorType', '')]),
                'css_files': len([r for r in resources if 'css' in r.get('name', '')]),
                'images': len([r for r in resources if r.get('initiatorType') == 'img']),
                'total_size': sum([r.get('transferSize', 0) for r in resources])
            }
            
            perf_metrics['resources'] = resource_summary
            
        except Exception as e:
            self.log_issue('PERF-001', 'P1', 'performance', f'Performance analysis failed: {e}')
        
        self.performance_metrics = perf_metrics
        return perf_metrics
    
    def check_seo(self, driver):
        """Check SEO best practices"""
        seo_checks = {}
        
        try:
            # Check title
            title = driver.title
            if not title:
                self.seo_issues.append({'issue': 'missing_title', 'severity': 'P0'})
            elif len(title) > 60:
                self.seo_issues.append({'issue': 'title_too_long', 'length': len(title), 'severity': 'P2'})
            
            # Check meta description
            meta_desc = driver.find_elements(By.CSS_SELECTOR, 'meta[name="description"]')
            if not meta_desc:
                self.seo_issues.append({'issue': 'missing_meta_description', 'severity': 'P0'})
            elif meta_desc[0].get_attribute('content') and len(meta_desc[0].get_attribute('content')) > 160:
                self.seo_issues.append({'issue': 'meta_description_too_long', 'severity': 'P2'})
            
            # Check h1 tags
            h1_tags = driver.find_elements(By.TAG_NAME, 'h1')
            if not h1_tags:
                self.seo_issues.append({'issue': 'missing_h1', 'severity': 'P0'})
            elif len(h1_tags) > 1:
                self.seo_issues.append({'issue': 'multiple_h1', 'count': len(h1_tags), 'severity': 'P1'})
            
            # Check canonical
            canonical = driver.find_elements(By.CSS_SELECTOR, 'link[rel="canonical"]')
            if not canonical:
                self.seo_issues.append({'issue': 'missing_canonical', 'severity': 'P1'})
            
            # Check Open Graph
            og_tags = driver.find_elements(By.CSS_SELECTOR, 'meta[property^="og:"]')
            if not og_tags:
                self.seo_issues.append({'issue': 'missing_open_graph', 'severity': 'P2'})
                
        except Exception as e:
            self.log_issue('SEO-001', 'P1', 'seo', f'SEO check failed: {e}')
        
        return self.seo_issues
    
    def check_security_headers(self):
        """Check security headers"""
        try:
            response = requests.head(SITE_URL, timeout=10)
            headers = response.headers
            
            # Required security headers
            required_headers = [
                'Content-Security-Policy',
                'X-Frame-Options',
                'X-Content-Type-Options',
                'Strict-Transport-Security',
                'Referrer-Policy'
            ]
            
            for header in required_headers:
                if header not in headers:
                    self.security_issues.append({
                        'issue': f'missing_{header.lower().replace("-", "_")}',
                        'severity': 'P0'
                    })
            
        except Exception as e:
            self.log_issue('SEC-001', 'P0', 'security', f'Security header check failed: {e}')
        
        return self.security_issues
    
    def log_issue(self, issue_id, severity, issue_type, description, element=None, fix=None):
        """Log an issue to the issues list"""
        issue = {
            'id': issue_id,
            'severity': severity,
            'type': issue_type,
            'description': description,
            'timestamp': datetime.now().isoformat()
        }
        if element:
            issue['element'] = element
        if fix:
            issue['fix_recommendation'] = fix
        
        self.issues.append(issue)
    
    def generate_reports(self):
        """Generate all audit reports"""
        # Generate issues JSON
        issues_json = {
            'site': SITE_URL,
            'run_id': AUDIT_TIMESTAMP,
            'issues': self.issues,
            'component_inventory': self.component_inventory,
            'interaction_map': self.interaction_map,
            'performance_metrics': self.performance_metrics,
            'accessibility_issues': self.accessibility_issues,
            'seo_issues': self.seo_issues,
            'security_issues': self.security_issues
        }
        
        with open(BASE_DIR / 'reports' / 'audit_results.json', 'w') as f:
            json.dump(issues_json, f, indent=2)
        
        # Generate defects CSV
        csv_content = "id,title,severity,type,description,fix_recommendation,status\\n"
        for issue in self.issues:
            csv_content += f"{issue['id']},{issue['description'][:50]},{issue['severity']},{issue['type']},\"{issue['description']}\",\"{issue.get('fix_recommendation', 'TBD')}\",Open\\n"
        
        with open(BASE_DIR / 'reports' / 'defects.csv', 'w') as f:
            f.write(csv_content)
        
        # Generate executive summary
        summary = f"""# ProtoThrive Frontend Audit - Executive Summary
        
## Audit Date: {AUDIT_TIMESTAMP}
## Target: {SITE_URL}

### Key Findings

#### Critical Issues (P0)
- {len([i for i in self.issues if i['severity'] == 'P0'])} critical issues found
- {len([i for i in self.accessibility_issues if i['severity'] == 'P0'])} accessibility blockers
- {len([i for i in self.security_issues if i['severity'] == 'P0'])} security vulnerabilities

#### High Priority Issues (P1)
- {len([i for i in self.issues if i['severity'] == 'P1'])} high priority issues

#### Components Inventory
- Buttons: {len(self.component_inventory.get('buttons', []))}
- Links: {len(self.component_inventory.get('links', []))}
- Forms: {len(self.component_inventory.get('forms', []))}
- Inputs: {len(self.component_inventory.get('inputs', []))}

#### Performance Metrics
{json.dumps(self.performance_metrics, indent=2)}

#### Accessibility Issues
- Total: {len(self.accessibility_issues)}

#### SEO Issues
- Total: {len(self.seo_issues)}

#### Security Issues
- Total: {len(self.security_issues)}
"""
        
        with open(BASE_DIR / 'reports' / 'executive_summary.md', 'w') as f:
            f.write(summary)
        
        print(f"\\n✅ Audit complete! Results saved to: {BASE_DIR}")
        print(f"   - Executive Summary: {BASE_DIR}/reports/executive_summary.md")
        print(f"   - Full Results JSON: {BASE_DIR}/reports/audit_results.json")
        print(f"   - Defects CSV: {BASE_DIR}/reports/defects.csv")
        print(f"   - Screenshots: {BASE_DIR}/screenshots/")
    
    def run_full_audit(self):
        """Run the complete audit"""
        print("🚀 Starting ProtoThrive Frontend Audit...")
        print(f"   Target: {SITE_URL}")
        print(f"   Timestamp: {AUDIT_TIMESTAMP}")
        
        driver = self.setup_driver()
        if not driver:
            print("❌ Failed to setup driver. Exiting.")
            return
        
        try:
            print("\\n📊 Phase 1: Initial State Capture...")
            initial_state = self.capture_initial_state(driver)
            if initial_state:
                print(f"   ✓ Title: {initial_state['title']}")
                print(f"   ✓ Console errors: {initial_state['console_errors']}")
            
            print("\\n🔍 Phase 2: Component Analysis...")
            components = self.analyze_components(driver)
            print(f"   ✓ Found {len(components['buttons'])} buttons")
            print(f"   ✓ Found {len(components['links'])} links")
            
            print("\\n🎯 Phase 3: Interaction Testing...")
            interactions = self.test_interactions(driver)
            print(f"   ✓ Tested {len(interactions)} interactions")
            
            print("\\n♿ Phase 4: Accessibility Audit...")
            a11y = self.check_accessibility(driver)
            print(f"   ✓ Found {len(a11y)} accessibility issues")
            
            print("\\n📱 Phase 5: Responsive Design Test...")
            responsive = self.check_responsive_design(driver)
            print(f"   ✓ Tested 5 viewports")
            
            print("\\n⚡ Phase 6: Performance Analysis...")
            perf = self.analyze_performance(driver)
            if perf:
                print(f"   ✓ Page load time: {perf.get('page_load_time', 'N/A')}ms")
            
            print("\\n🔍 Phase 7: SEO Check...")
            seo = self.check_seo(driver)
            print(f"   ✓ Found {len(seo)} SEO issues")
            
            print("\\n🔒 Phase 8: Security Headers Check...")
            security = self.check_security_headers()
            print(f"   ✓ Found {len(security)} security issues")
            
        finally:
            driver.quit()
        
        print("\\n📝 Generating Reports...")
        self.generate_reports()

if __name__ == "__main__":
    auditor = ProtoThriveAuditor()
    auditor.run_full_audit()
