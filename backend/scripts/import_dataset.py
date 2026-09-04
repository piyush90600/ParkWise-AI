"""Import every CSV under data/dataset into MongoDB.
Passwords are converted to bcrypt hashes during import when they are not already bcrypt hashes.
Run from the backend directory: python scripts/import_dataset.py --reset
"""
import argparse, os, re, sys
from pathlib import Path
import pandas as pd
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv
import bcrypt

ROOT=Path(__file__).resolve().parents[1]; load_dotenv(ROOT/'.env')
URL=os.getenv('MONGODB_URL','mongodb://127.0.0.1:27017'); DB=os.getenv('MONGODB_DB','parkwise_ai')
DATA=ROOT.parent/'ml'/'dataset'
COLS={'admins':'admins','bookings':'bookings','lot_occupancy_hourly':'lot_occupancy_hourly','owners':'owners','parking_lots':'parking_lots','payments':'payments','reviews':'reviews','slots':'slots','users':'users'}
ID_FIELDS={
    'admins':'admins_id',
    'bookings':'bookings_id',
    'lot_occupancy_hourly':None,
    'owners':'owners_id',
    'parking_lots':'parking_lots_id',
    'payments':'payments_id',
    'reviews':'reviews_id',
    'slots':'id',
    'users':'users_id'
}
def clean(v):
    if pd.isna(v): return None
    if isinstance(v,pd.Timestamp): return v.to_pydatetime()
    if hasattr(v,'item'):
        try:return v.item()
        except:pass
    return v

def is_hash(v): return isinstance(v,str) and v.startswith('$2') and len(v)>=50

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--reset',action='store_true'); args=ap.parse_args()
    client=MongoClient(URL); db=client[DB]; client.admin.command('ping')
    if args.reset:
        for c in COLS.values(): db[c].drop()
    for stem,c in COLS.items():
        f=DATA/f'{stem}.csv'
        if not f.exists(): print('SKIP',f); continue
        df=pd.read_csv(f)
        docs=[]
        for row in df.to_dict('records'):
            d={k:clean(v) for k,v in row.items()}
            if 'password' in d and d['password'] and not is_hash(d['password']): d['password']=bcrypt.hashpw(str(d['password']).encode(),bcrypt.gensalt()).decode()
            docs.append(d)
        key=ID_FIELDS[stem]
        if key:
            ops=[UpdateOne({key:d[key]},{'$set':d},upsert=True) for d in docs]
            if ops: db[c].bulk_write(ops,ordered=False)
        else:
            db[c].delete_many({}); db[c].insert_many(docs,ordered=False)
        print(f'{c}: {len(docs)} records imported')
    # Helpful indexes
    for c in ['users','owners','admins']: db[c].create_index('email',unique=True)
    print(f'\nDatabase ready: {DB}')

if __name__=='__main__': main()
