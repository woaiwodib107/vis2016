import json

fin = open("tNetData_HIS_MaxD.json", "r")

data = json.load(fin)

metrics = ['H', 'HIS', 'ICC', 'MaxD', 'aggre_constraint', 'betweenness', 'clust_coef', 'effective_size', 'local_effic', 'pagerank']
time = "2013"
nodes = data[time]["nodes"]

for metric in metrics:
    pageranks = sorted(map(lambda x:x[metric], nodes), reverse=True)

    name = ["Helwig Hauser"]

    target = filter(lambda x:x["id"] in name, nodes)

    for t in target:
        print pageranks.index(t[metric]), t[metric], metric
