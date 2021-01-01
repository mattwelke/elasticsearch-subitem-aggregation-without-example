var elasticsearch = require('elasticsearch');

async function waitMs(ms) {
    return new Promise((accept, _reject) => {
        setTimeout(accept, ms);
    });
}

async function main() {
    var client = new elasticsearch.Client({
        host: 'localhost:9200',
        log: 'warning'
    });

    await client.ping({
        requestTimeout: 2000,
    });

    
    // WITH NESTED:
    const EVENTS_WITH_NESTED = 'events_with_nested';

    await client.indices.delete({
        index: EVENTS_WITH_NESTED,
        ignore: 404,
    });
    await client.indices.create({
        index: EVENTS_WITH_NESTED,
    });
    await client.indices.putMapping({
        index: EVENTS_WITH_NESTED,
        body: {
            properties: {
                products: {
                    type: 'nested',
                    properties: {
                        productId: {
                            type: 'keyword'
                        },
                    },
                },
            },
        },
    });

    client.index({
        index: EVENTS_WITH_NESTED,
        body: {
            "products": [
                {
                    "productId": "abc"
                },
            ]
        },
        refresh: true,
    });
    client.index({
        index: EVENTS_WITH_NESTED,
        body: {
            "products": [
                {
                    "productId": "abc"
                },
                {
                    "productId": "def"
                }
            ]
        },
        refresh: true,
    });
    await waitMs(500);
    console.log(`Inserted docs with nested.`);

    const aggResWithNested = await client.search({
        body: {
            "size": 0,
            "aggs": {
                "products": {
                    "nested": {
                        "path": "products"
                    },
                    "aggs": {
                        "popular": {
                            "terms": {
                                "field": "products.productId"
                            }
                        }
                    }
                }
            }
        }
    });
    const bucketsWithNested = aggResWithNested.aggregations.products.popular.buckets;
    console.log(`Agg results with nested:`, JSON.stringify(bucketsWithNested, null, 2));


    // WITHOUT NESTED:
    const EVENTS_WITHOUT_NESTED = 'events_without_nested';

    await client.indices.delete({
        index: EVENTS_WITHOUT_NESTED,
        ignore: 404,
    });
    await client.indices.create({
        index: EVENTS_WITHOUT_NESTED,
    });
    await client.indices.putMapping({
        index: EVENTS_WITHOUT_NESTED,
        body: {
            properties: {
                productIds: {
                    type: 'keyword',
                },
            },
        },
    });

    client.index({
        index: EVENTS_WITHOUT_NESTED,
        body: {
            "productIds": "abc"
        },
        refresh: true,
    });
    client.index({
        index: EVENTS_WITHOUT_NESTED,
        body: {
            "productIds": "abc|def"
        },
        refresh: true,
    });
    await waitMs(500);
    console.log(`Inserted docs without nested.`);

    const aggResWithoutNested = await client.search({
        body: {
            "size": 0,
            "aggs": {
                "popular_products": {
                    "terms": {
                        "field": "productIds"
                    }
                }
            }
        }
    });

    const rawBucketsWithoutNested = aggResWithoutNested.aggregations.popular_products.buckets;
    console.log(`Raw agg results without nested:`, JSON.stringify(rawBucketsWithoutNested, null, 2));

    const processedBuckets = {};
    for (const bucket of rawBucketsWithoutNested) {
        const keys = bucket.key.split('|');
        for (const key of keys) {
            if (!processedBuckets[key]) {
                processedBuckets[key] = 1;
            } else {
                processedBuckets[key]++;
            }
        }
    }
    console.log(`Processed agg results without nested:`, JSON.stringify(processedBuckets, null, 2));
}

main().catch(console.error);
