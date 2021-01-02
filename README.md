# elasticsearch-subitem-aggregation-without-nested-example

Inspired by this [blog post](https://blog.gojekengineering.com/elasticsearch-the-trouble-with-nested-documents-e97b33b46194), demonstrates how to avoid using the `nested` field type in Elasticsearch to reduce the number of documents stored and queried in Elasticsearch for a `terms` aggregation. It uses the `array` field type instead. This works for some use cases.

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
Inserted docs with array.
Agg results with array: [
  {
    "key": "abc",
    "doc_count": 2
  },
  {
    "key": "def",
    "doc_count": 1
  }
]
```

Note how the aggregation results are identical.

Output from `/_cat/indices?format=json` after running `index.js`:

```json
[
  {
    "health": "yellow",
    "status": "open",
    "index": "events_with_nested",
    "uuid": "Gt2dLZMbTcqRZwdWaXeI6A",
    "pri": "1",
    "rep": "1",
    "docs.count": "5",
    "docs.deleted": "0",
    "store.size": "6.8kb",
    "pri.store.size": "6.8kb"
  },
  {
    "health": "yellow",
    "status": "open",
    "index": "events_with_array",
    "uuid": "dYlfAEIESZOuNqEvaTwg4g",
    "pri": "1",
    "rep": "1",
    "docs.count": "2",
    "docs.deleted": "0",
    "store.size": "6.5kb",
    "pri.store.size": "6.5kb"
  }
]
```

Note how the index using the `array` field instead of the `nested` field has a lower `docs.count`.

This approach works for use cases where aspects of the nested documents don't need to be taken into account at query time. For example, if products had more fields than just ID, such as "category", and a query had to include only products with a certain category in the aggregation results, this wouldn't work, because the aggregation is being done taking into account fields of only the single, outer document.
