import pymongo
import random
con = pymongo.Connection("localhost", 27017)
db = con.vis2016

clusters = db.clusters
nodes = db.nodes

nids = range(0,20)
for i in xrange(0, 10):
    cluster = {}
    cluster['id'] = i
    nNum = int(random.random() * 20)
    
    random.shuffle(nids)
    cluster['nodes'] = nids[0:nNum]
    clusters.insert(cluster)

metricNum = 10

years = range(2000, 2016)
for i in xrange(0, 20):
    node = {}
    node['id'] = i
    eTime = int(random.random() * 10 + 2)

    random.shuffle(years)
    times = sorted(years[0:eTime])
    baseRanks = range(0,20)
    node['data'] = []
    for t in times:
        temp = {}
        ranks = []
        baseRankIndex = int(random.random() * len(baseRanks))
        for m in xrange(0, metricNum):
            r = baseRanks[baseRankIndex] + int((random.random() - 0.5) * 20)
            if r < 0:
                r = 0
            elif r > 19:
                r = 19
            ranks.append(r)
        temp['ranks'] = ranks
        temp['mean'] = float(sum(ranks))/len(ranks)
        temp['year'] = t
        node['data'].append(temp)
    nodes.insert(node)
        
        
    
    
    
