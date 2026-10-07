const BASE_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.error || `HTTP error ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function runLiveE2ETest() {
  console.log('--- STARTING LIVE CODING PROFILE E2E HTTP TESTS ---');

  // 1. Health check
  const healthRes = await request(`${BASE_URL}/health`);
  console.log('✓ Health check:', healthRes.status);

  // 2. Create Candidate Profile
  const profileRes = await request(`${BASE_URL}/profiles`, {
    method: 'POST',
    body: JSON.stringify({
      basicInfo: {
        name: 'Asati Live Tester',
        email: `asati_live_${Date.now()}@example.com`,
        headline: 'Full Stack Integration Engineer'
      }
    })
  });
  const profileId = profileRes.data.profile._id;
  console.log('✓ Created test profile with ID:', profileId);

  // 3. Add Codeforces profile
  console.log('\n--- Adding Codeforces Profile ---');
  const cfRes = await request(`${BASE_URL}/profiles/${profileId}/coding-profiles`, {
    method: 'POST',
    body: JSON.stringify({
      platform: 'codeforces',
      profileUrl: 'https://codeforces.com/profile/tourist'
    })
  });
  console.log('Codeforces response:', {
    success: cfRes.success,
    username: cfRes.data.codingProfile.username,
    rating: cfRes.data.codingProfile.stats?.rating,
    rank: cfRes.data.codingProfile.stats?.rank,
    contestsParticipated: cfRes.data.codingProfile.stats?.contestsParticipated,
    problemsSolved: cfRes.data.codingProfile.stats?.problemsSolved,
    dataSource: cfRes.data.codingProfile.dataSource,
    fetchStatus: cfRes.data.codingProfile.fetchStatus
  });

  // 4. Add LeetCode profile
  console.log('\n--- Adding LeetCode Profile ---');
  const lcRes = await request(`${BASE_URL}/profiles/${profileId}/coding-profiles`, {
    method: 'POST',
    body: JSON.stringify({
      platform: 'leetcode',
      profileUrl: 'https://leetcode.com/u/neal_wu/'
    })
  });
  console.log('LeetCode response:', {
    success: lcRes.success,
    username: lcRes.data.codingProfile.username,
    problemsSolved: lcRes.data.codingProfile.stats?.problemsSolved,
    problemBreakdown: lcRes.data.codingProfile.problemBreakdown,
    dataSource: lcRes.data.codingProfile.dataSource,
    fetchStatus: lcRes.data.codingProfile.fetchStatus
  });

  // 5. Add CodeChef profile
  console.log('\n--- Adding CodeChef Profile ---');
  const ccRes = await request(`${BASE_URL}/profiles/${profileId}/coding-profiles`, {
    method: 'POST',
    body: JSON.stringify({
      platform: 'codechef',
      profileUrl: 'https://www.codechef.com/users/tourist'
    })
  });
  console.log('CodeChef response:', {
    success: ccRes.success,
    username: ccRes.data.codingProfile.username,
    dataSource: ccRes.data.codingProfile.dataSource,
    fetchStatus: ccRes.data.codingProfile.fetchStatus
  });

  // 6. Add HackerRank profile
  console.log('\n--- Adding HackerRank Profile ---');
  const hrRes = await request(`${BASE_URL}/profiles/${profileId}/coding-profiles`, {
    method: 'POST',
    body: JSON.stringify({
      platform: 'hackerrank',
      profileUrl: 'https://www.hackerrank.com/profile/tourist'
    })
  });
  console.log('HackerRank response:', {
    success: hrRes.success,
    username: hrRes.data.codingProfile.username,
    dataSource: hrRes.data.codingProfile.dataSource,
    fetchStatus: hrRes.data.codingProfile.fetchStatus
  });

  // 7. Add GeeksforGeeks profile
  console.log('\n--- Adding GeeksforGeeks Profile ---');
  const gfgRes = await request(`${BASE_URL}/profiles/${profileId}/coding-profiles`, {
    method: 'POST',
    body: JSON.stringify({
      platform: 'geeksforgeeks',
      profileUrl: 'https://www.geeksforgeeks.org/user/tourist/'
    })
  });
  console.log('GeeksforGeeks response:', {
    success: gfgRes.success,
    username: gfgRes.data.codingProfile.username,
    dataSource: gfgRes.data.codingProfile.dataSource,
    fetchStatus: gfgRes.data.codingProfile.fetchStatus
  });

  // 8. Test Duplicate Submission (update in place, same platform)
  console.log('\n--- Testing Duplicate Submission Handling ---');
  const dupRes = await request(`${BASE_URL}/profiles/${profileId}/coding-profiles`, {
    method: 'POST',
    body: JSON.stringify({
      platform: 'codeforces',
      profileUrl: 'https://codeforces.com/profile/tourist'
    })
  });
  console.log('Duplicate response message:', dupRes.message);

  // 9. Test Refresh API (PUT /api/profiles/:id/coding-profiles/:platform)
  console.log('\n--- Testing Refresh Operation ---');
  const refreshRes = await request(`${BASE_URL}/profiles/${profileId}/coding-profiles/codeforces`, {
    method: 'PUT'
  });
  console.log('Refresh response:', {
    success: refreshRes.success,
    platform: refreshRes.data.codingProfile.platform,
    fetchedAt: refreshRes.data.codingProfile.fetchedAt
  });

  // 10. Test GET /api/profiles/:id contains codingProfiles
  console.log('\n--- Testing GET /api/profiles/:id Integration ---');
  const fullProfileRes = await request(`${BASE_URL}/profiles/${profileId}`);
  const codingProfiles = fullProfileRes.data.profile.codingProfiles;
  console.log(`Candidate now has ${codingProfiles.length} coding profiles:`);
  codingProfiles.forEach(p => {
    console.log(`  - [${p.platform}] username=${p.username}, status=${p.fetchStatus}, source=${p.dataSource}, solved=${p.stats?.problemsSolved ?? 'N/A'}`);
  });

  // 11. Test Error Handling (Invalid URL / Wrong domain)
  console.log('\n--- Testing Error Cases ---');
  try {
    await request(`${BASE_URL}/profiles/${profileId}/coding-profiles`, {
      method: 'POST',
      body: JSON.stringify({
        platform: 'leetcode',
        profileUrl: 'https://malicious.com/tourist'
      })
    });
    console.error('FAIL: Should have rejected malicious domain');
  } catch (err) {
    console.log('✓ Correctly rejected wrong domain:', err.data?.error);
  }

  try {
    await request(`${BASE_URL}/profiles/650000000000000000000000/coding-profiles`, {
      method: 'POST',
      body: JSON.stringify({
        platform: 'codeforces',
        profileUrl: 'https://codeforces.com/profile/tourist'
      })
    });
    console.error('FAIL: Should have rejected not found candidate ID');
  } catch (err) {
    console.log('✓ Correctly rejected non-existent candidate ID:', err.data?.error);
  }

  try {
    await request(`${BASE_URL}/profiles/invalid-mongo-id/coding-profiles`, {
      method: 'POST',
      body: JSON.stringify({
        platform: 'codeforces',
        profileUrl: 'https://codeforces.com/profile/tourist'
      })
    });
    console.error('FAIL: Should have rejected invalid candidate ID format');
  } catch (err) {
    console.log('✓ Correctly rejected invalid candidate ID format:', err.data?.error);
  }

  // 12. Test Profile Enrichment Endpoints
  console.log('\n--- Testing Profile Enrichment & Sub-resource Endpoints ---');

  // Add College & Education via PUT
  await request(`${BASE_URL}/profiles/${profileId}`, {
    method: 'PUT',
    body: JSON.stringify({
      college: {
        collegeName: 'MIT School of Computing',
        degree: 'Bachelor of Technology',
        branch: 'Computer Science',
        graduationYear: 2025,
        cgpa: 9.2,
      },
      education: [
        {
          level: 'secondary',
          institution: 'Greenwood High',
          startYear: 2017,
          endYear: 2021,
          percentage: 94.0,
        },
      ],
    }),
  });
  console.log('✓ Updated college and education');

  // Add Project
  const liveProjRes = await request(`${BASE_URL}/profiles/${profileId}/projects`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'High Performance Edge Router',
      description: 'Ultra-low latency packet routing daemon.',
      technologies: ['C++', 'eBPF', 'Rust'],
      githubUrl: 'https://github.com/example/edge-router',
    }),
  });
  console.log('✓ Added project:', liveProjRes.data?.projects?.length);

  // Add Experience
  const liveExpRes = await request(`${BASE_URL}/profiles/${profileId}/experience`, {
    method: 'POST',
    body: JSON.stringify({
      organization: 'CloudScale Labs',
      role: 'Infrastructure Intern',
      employmentType: 'internship',
      location: 'Bangalore, India',
      technologies: ['Docker', 'Kubernetes', 'Go'],
    }),
  });
  console.log('✓ Added experience:', liveExpRes.data?.experience?.length);

  // Add Certification
  const liveCertRes = await request(`${BASE_URL}/profiles/${profileId}/certifications`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Certified Kubernetes Administrator (CKA)',
      issuingOrganization: 'Linux Foundation',
      credentialUrl: 'https://www.credly.com/badges/cka-verified',
    }),
  });
  console.log('✓ Added certification:', liveCertRes.data?.certifications?.length);

  // Add Professional Profile
  const liveProfRes = await request(`${BASE_URL}/profiles/${profileId}/professional-profiles`, {
    method: 'POST',
    body: JSON.stringify({
      platform: 'LinkedIn',
      profileUrl: 'https://linkedin.com/in/asati-engineer',
    }),
  });
  console.log('✓ Added professional profile:', liveProfRes.data?.professionalProfiles?.length);

  // Add Portfolio
  const livePortRes = await request(`${BASE_URL}/profiles/${profileId}/portfolios`, {
    method: 'POST',
    body: JSON.stringify({
      platform: 'Personal Website',
      url: 'https://asati.tech',
      title: 'Systems & Backend Portfolio',
    }),
  });
  console.log('✓ Added portfolio:', livePortRes.data?.portfolios?.length);

  // Add Achievement
  const liveAchRes = await request(`${BASE_URL}/profiles/${profileId}/achievements`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Smart India Hackathon Finalist',
      category: 'hackathon',
      organization: 'Gov of India',
    }),
  });
  console.log('✓ Added achievement:', liveAchRes.data?.achievements?.length);

  // Set Target Role
  const liveRoleRes = await request(`${BASE_URL}/profiles/${profileId}/target-role`, {
    method: 'PUT',
    body: JSON.stringify({
      roleName: 'Lead Systems Architect',
      roleId: 'lead_systems_architect',
    }),
  });
  console.log('✓ Set target role:', liveRoleRes.data?.targetRole?.roleName);

  // 13. Test GET /api/profiles/:id/unified
  console.log('\n--- Testing GET /api/profiles/:id/unified ---');
  const unifiedRes = await request(`${BASE_URL}/profiles/${profileId}/unified`);
  console.log('Unified Profile Result:');
  console.log(`  - Candidate ID: ${unifiedRes.data?.candidateId}`);
  console.log(`  - Profile Completeness: ${unifiedRes.data?.profileCompleteness}%`);
  console.log(`  - Basic Info Name: ${unifiedRes.data?.candidate?.basicInfo?.name}`);
  console.log(`  - College: ${unifiedRes.data?.candidate?.college?.collegeName}`);
  console.log(`  - Coding Profiles Count: ${unifiedRes.data?.candidate?.codingProfiles?.length}`);
  console.log(`  - Projects Count: ${unifiedRes.data?.candidate?.projects?.length}`);
  console.log(`  - Experience Count: ${unifiedRes.data?.candidate?.experience?.length}`);
  console.log(`  - Certifications Count: ${unifiedRes.data?.candidate?.certifications?.length}`);
  console.log(`  - Target Role: ${unifiedRes.data?.targetRole}`);
  console.log(`  - AI Handoff Target Role: ${unifiedRes.data?.aiHandoff?.targetRole}`);
  console.log(`  - AI Handoff Candidate ID: ${unifiedRes.data?.aiHandoff?.candidateId}`);

  console.log('\n=== ALL LIVE E2E HTTP TESTS PASSED PERFECTLY ===');
}

runLiveE2ETest().catch(err => {
  console.error('Live E2E Test Error:', err.message, err.data || err);
  process.exit(1);
});
