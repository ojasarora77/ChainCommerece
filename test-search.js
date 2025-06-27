#!/usr/bin/env node

/**
 * Test script to verify the AI Shopping Assistant search functionality
 * Run this to debug search issues
 */

const { ContractProductService } = require('./packages/nextjs/services/marketplace/contractProductService.ts');

async function testSearch() {
  console.log('🧪 Testing AI Shopping Assistant Search Functionality\n');
  
  const service = new ContractProductService();
  
  // Test queries that should find existing products
  const testQueries = [
    'ai powered smart watch',
    'smart fitness tracker',
    'fitness tracker',
    'smartwatch',
    'smart watch',
    'ai coaching',
    'web3 rewards',
    'organic cotton watch band',
    'watch band',
    'bamboo laptop stand',
    'sustainable bamboo'
  ];

  for (const query of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Testing query: "${query}"`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const results = await service.searchProducts(query);
      
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} results:`);
        results.forEach((product, index) => {
          console.log(`\n${index + 1}. ${product.name}`);
          console.log(`   💰 Price: $${product.priceUSD} (${product.price} ${product.chain === 'ethereum' ? 'ETH' : 'AVAX'})`);
          console.log(`   📂 Category: ${product.category}`);
          console.log(`   🌱 Sustainability: ${product.sustainabilityScore}%`);
          console.log(`   📜 Certifications: ${product.certifications?.join(', ') || 'None'}`);
          console.log(`   📝 Description: ${product.description.substring(0, 100)}...`);
        });
      } else {
        console.log(`❌ No results found for "${query}"`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing query "${query}":`, error.message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🏁 Search testing complete!');
  console.log(`${'='.repeat(60)}`);
}

// Run the test
testSearch().catch(console.error);
