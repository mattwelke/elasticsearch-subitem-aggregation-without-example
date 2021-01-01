# elasticsearch-subitem-aggregation-without-nested-example

Inspired by this [blog post](https://blog.gojekengineering.com/elasticsearch-the-trouble-with-nested-documents-e97b33b46194), demonstrates how to avoid using the `nested` field type in Elasticsearch to reduce the number of documents stored and queried in Elasticsearch for a `terms` aggregation.

Can use `docker-compose up` to run Elasticsearch.

Output from running `node index.js`:

```
Inserted docs with nested.
Agg results with nested: [
  {
    "key": "abc",
    "doc_count": 2
  },
  {
    "key": "def",
    "doc_count": 1
  }
]
Inserted docs without nested.
Raw agg results without nested: [
  {
    "key": "abc",
    "doc_count": 1
  },
  {
    "key": "abc|def",
    "doc_count": 1
  }
]
Processed agg results without nested: {
  "abc": 2,
  "def": 1
}
```

Note how there's a post processing step.

Output from `/_cat/indices?format=json` after running `index.js`:

```json
[
  {
    "health": "yellow",
    "status": "open",
    "index": "events_without_nested",
    "uuid": "dRn0xYIJTEuYlmhGH_p7VA",
    "pri": "1",
    "rep": "1",
    "docs.count": "2",
    "docs.deleted": "0",
    "store.size": "6.6kb",
    "pri.store.size": "6.6kb"
  },
  {
    "health": "yellow",
    "status": "open",
    "index": "events_with_nested",
    "uuid": "yornNrJiTJSySdwzp1uB6Q",
    "pri": "1",
    "rep": "1",
    "docs.count": "5",
    "docs.deleted": "0",
    "store.size": "7kb",
    "pri.store.size": "7kb"
  }
]
```

Note how the index without using the `nested` field type has a lower `docs.count`.

Works for use cases where aspects of the nested documents don't need to be taken into account at query time, ex. for filtering. Expectation is that inaccuracy of only taking into account top ten buckets (ignoring buckets like `abc|def|ghi` with many subitems together) is okay for datasets where subitems occur most often alone or in combinations of 1 or 2, not many subitems. Needs to be verified for your dataset to make sure order of buckets after processing doesn't change compared to solution with `nested` field type.
