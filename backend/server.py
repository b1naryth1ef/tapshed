from gevent import monkey; monkey.patch_all()

import json
import bottle
import time

from urllib.parse import urlparse, parse_qs
from bottle import response, request
from clickhouse_driver import Client
from clickhouse_driver.errors import Error

def _json_handle_default(obj):
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return obj


def sse_pack(idx, event, data):
    return 'retry: 10000\nid: {}\nevent: {}\ndata: {}\n\n'.format(
        idx,
        event,
        json.dumps(data, default=_json_handle_default)
    )


@bottle.route('/query')
def query():
    url = request.query.get('url', 'ch://localhost:9091')
    parsed = urlparse(url)

    ch_client = Client(
        parsed.hostname or 'localhost',
        port=(parsed.port or 9000),
        compression=bool(request.query.get('compression', True)),
    )
    event_id = 0

    response.content_type = 'text/event-stream'
    response.cache_control = 'no-cache'
    response.set_header('Access-Control-Allow-Origin', '*')

    try:
        start = time.time()
        progress = ch_client.execute_with_progress(request.query.query, with_column_types=True)
        for num_rows, num_bytes, total_rows in progress:
            yield sse_pack(event_id, 'progress', {
                'num_rows': num_rows,
                'total_rows': total_rows,
            })
            event_id += 1

        rows, columns = progress.get_result()
        yield sse_pack(event_id, 'result', {
            'rows': rows,
            'columns': [{'name': i[0], 'type': i[1]} for i in columns],
            'error': None,
            'stats': {
                'rows': rows,
                'bytes': num_bytes,
                'duration': int((time.time() - start) * 1000),
            }
        })
    except Error as e:
        yield sse_pack(event_id, 'result', {
            'rows': [],
            'columns': [],
            'error': {
                'code': e.code,
                'message': e.message,
            },
            'stats': None
        })
    finally:
        ch_client.disconnect()


def main():
    bottle.run(port=9090, server="gevent", debug=True)

if __name__ == '__main__':
    main()
