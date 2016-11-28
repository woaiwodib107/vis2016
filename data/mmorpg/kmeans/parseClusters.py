import json
from pymongo import MongoClient
from compiler.ast import flatten
import sys
con = MongoClient('localhost', 27017)
db = con.vis2016_mmo

data = json.load(open("speudoClusters.json", "r"))
ranks = json.load(open("tRankData_kmeans.json", "r"))

db_clusters = db.clusters
db_nodes = db.nodes

clusterID = 0
clusters = []

keys = [u'H', u'HIS', u'ICC', u'aggre_constraint', u'betweenness', u'clust_coef', u'effective_size', u'local_effic', u'pagerank']

def genCluster(d, clusters):
    global clusterID
    clu = {"id":clusterID, "children":[]}
    clusterID += 1
    if "children" in d:
        for c in d["children"]:
            child = genCluster(c, clusters)
            clu["children"].append(child["id"])
        clu["data"] = flatten(d["nodes"])
        clusters.append(clu)
        #for c in d["children"]:
        #    genCluster(c, clusters)
    else:
        clu["data"] = flatten(d["nodes"])
        clusters.append(clu)
    return clu

genCluster(data, clusters)
for c in clusters:
    db_clusters.insert(c)

times = set()
for name in ranks.keys():
    node = ranks[name]
    tmpNode = {}
    tmpNode['name'] = name
    tmpNode['data'] = []
    
    for y in node.keys():
        #print sorted(node[y].keys())
        temp = {}
        temp['ranks'] = map(lambda x:node[y][x], sorted(node[y].keys()))
        temp['mean'] = float(sum(temp['ranks'])) / len(temp['ranks'])
        temp['time'] = int("".join(y.split("_")[0].split("-")[1:3]))
        times.add(temp['time'])
        tmpNode['data'].append(temp)
    db_nodes.insert(tmpNode)


'''
clusterID = 0
for cluster in clusters:
    if len(flatten(cluster)) > 1000:
        continue
    tmpCluster = {}
    tmpCluster['id'] = clusterID
    clusterID += 1
    tmpCluster['nodes'] = flatten(cluster)
    tmpCluster['structure'] = cluster
    db_clusters.insert(tmpCluster)
    for node in flatten(cluster):
        rank = ranks[node]
        tmpNode = {}
        tmpNode['name'] = node
        tmpNode['data'] = []
        for year in rank.keys():
            temp = {}
            temp['ranks'] = map(lambda x:rank[year][x], sorted(rank[year].keys()))
            temp['mean'] = float(sum(temp['ranks'])) / len(temp['ranks'])
            temp['year'] = year
            tmpNode['data'].append(temp)
        db_nodes.insert(tmpNode)
        #sys.exit()
        #for year in rank.keys():
            
'''


    
    
    
