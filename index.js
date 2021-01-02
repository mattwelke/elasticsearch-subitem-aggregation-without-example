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
        index: EVENTS_WITH_NESTED,
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


    // WITH ARRAY:
    const EVENTS_WITH_ARRAY = 'events_with_array';

    await client.indices.delete({
        index: EVENTS_WITH_ARRAY,
        ignore: 404,
    });
    await client.indices.create({
        index: EVENTS_WITH_ARRAY,
    });
    await client.indices.putMapping({
        index: EVENTS_WITH_ARRAY,
        body: {
            properties: {
                productIds: {
                    type: 'keyword',
                },
            },
        },
    });

    client.index({
        index: EVENTS_WITH_ARRAY,
        body: {
            "productIds": [ "abc" ]
        },
        refresh: true,
    });
    client.index({
        index: EVENTS_WITH_ARRAY,
        body: {
            "productIds": [ "abc", "def" ]
        },
        refresh: true,
    });
    await waitMs(500);
    console.log(`Inserted docs with array.`);

    const aggResWithArray = await client.search({
        index: EVENTS_WITH_ARRAY,
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

    const bucketsWithArray = aggResWithArray.aggregations.popular_products.buckets;
    console.log(`Agg results with array:`, JSON.stringify(bucketsWithArray, null, 2));
}

main().catch(console.error);
